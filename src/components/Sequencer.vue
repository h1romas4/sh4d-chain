<script setup>
import { ref, onMounted, getCurrentInstance, reactive } from 'vue'

/**
 * External State (WEBMIDI.js Singleton)
 *
 * @typedef {import('webmidi').WebMidi} WebMidi
 * @type {WebMidi}
 */
const $webmidi = getCurrentInstance().appContext.config.globalProperties.$webmidi

/**
 * Vue Component Props
 */
const props = defineProps([
  'saveState',
])

/**
 * Vue Emits
 */
const emit = defineEmits([
  'notify-busy-state',
  'save-and-change',
])

/**
 * Vue Expose
 */
defineExpose({
  setMIDISetting,
});

/**
 * Vue State
 */
const isPlaying = ref(false)
const nowPatternIndex = ref(null)
const nextPatternIndex = ref(null)
const bpm = ref(0)
const quarterBeat = ref(false)
const addPatternBank = ref(null)
const addPatternNo = ref(null)
const addPatternStep = ref(null)
const addPatternScale = ref(null)
const optionSendPCLastStep = ref(null)
const patternBankList = ref([])
const patternNoList = ref([])
const patternScaleList = ref([])
const sequence = reactive([])

/**
 * Vue Event
 */
onMounted(() => {
  defaultValue()
})

/**
 * Internal
 */
const clockQuarterNote = 24 // MIDI clock - 4 beat per 24 tick
const defaultPattern = { bank: 8, no: 1, scale: 16, step: 64 }
let outputDevice = null
let inputDevice = null
let pcChannel = null
let midiOutputChannel = null;
let pcMSB = null
let pcLSB = null
let now = 0
let midiClock = 0
let sampleClock = []

/**
 * Vue Expose (for parent)
 *
 * @param {number} outputDeviceId
 * @param {number} inputDeviceId
 * @param {number} pcChannel
 * @param {number} pcMSB
 * @param {number} pcLSB
 */
function setMIDISetting(outputDeviceId, inputDeviceId, pcChannelNo, pcMSBNm, pcLSBNm) {
  outputDevice = $webmidi.getOutputById(outputDeviceId);
  inputDevice = $webmidi.getInputById(inputDeviceId);
  pcChannel = pcChannelNo;
  midiOutputChannel = outputDevice.channels[pcChannel]
  pcMSB = pcMSBNm;
  pcLSB = pcLSBNm;
  inputDevice.removeListener()
  inputDevice.addListener("clock", onMIDIClock) // 0xf8
  inputDevice.addListener("start", onMIDIStart) // 0xfa
  inputDevice.addListener("stop", onMIDIStop) // 0xfc
}

/**
 * onMIDIClock
 *
 * @param {*} event
 */
function onMIDIClock(event) {
  // bpm sync
  if(now != 0) {
    sampleClock.push(event.timestamp - now)
    if(sampleClock.length > clockQuarterNote) {
      sampleClock.shift()
      const average = sampleClock.reduce((a1, a2) => a1 + a2, 0) / sampleClock.length
      bpm.value = Math.round(2.5 / average * 1000)
    }
  }
  // beat
  nextPattern(midiClock)
  // midi clock
  midiClock++
  if(midiClock >= clockQuarterNote) {
    quarterBeat.value = !quarterBeat.value
    midiClock = 0
  }
  now = event.timestamp
}

/**
 * nextPattern
 *
 * @param {*} midiClock
 * @param {*} scale
 */
function nextPattern(midiClock) {
  if(nowPatternIndex.value == null) {
    return
  }
  // next pattern index
  if(nowPatternIndex.value + 1 >= sequence.length) {
    nextPatternIndex.value = 0
  } else {
    nextPatternIndex.value = nowPatternIndex.value + 1
  }
  // send program change
  let wait
  if(optionSendPCLastStep.value) {
    // Just before the last step
    wait = sequence[nowPatternIndex.value].step - 3
  } else {
    // It seems that at least 2 MIDI clock waits are required for program change.
    wait = 1
  }
  if(sequence[nowPatternIndex.value].now == wait && !sequence[nowPatternIndex.value].nextPCed) {
    sendSH4dPc(sequence[nextPatternIndex.value].bank, sequence[nextPatternIndex.value].no)
    sequence[nowPatternIndex.value].nextPCed = true
  }
  // step count
  const scale = sequence[nowPatternIndex.value].scale
  if(((midiClock + 1) % (clockQuarterNote / (scale / 4))) == 0) {
    sequence[nowPatternIndex.value].now++
  }
  // next sequence
  if(sequence[nowPatternIndex.value].step < sequence[nowPatternIndex.value].now + 1) {
    sequence[nowPatternIndex.value].now = 0
    sequence[nowPatternIndex.value].nextPCed = false
    nowPatternIndex.value = nextPatternIndex.value
  }
}

/**
 * sendSH4dPc
 *
 * @param {*} bank
 * @param {*} no
 */
function sendSH4dPc(bank, no) {
  midiOutputChannel.sendControlChange(0, pcMSB) // CC0 bank select MSB 0x55
  midiOutputChannel.sendControlChange(0x20, pcLSB) // CC32 bank select LSB 0x0
  midiOutputChannel.sendProgramChange((bank - 1) * 16 + (no - 1)) // Program change
}

/**
 * pcFirstStep
 *
 * @param {*} change
 */
function pcFirstStep(change = true) {
  if(sequence.length > 0 && change) {
    sendSH4dPc(sequence[0].bank, sequence[0].no)
  }
}

/**
 * onMIDIStart
 *
 * @param {*} event
 */
function onMIDIStart(event) {
  midiClock = 0
  nowPatternIndex.value = null
  if(sequence.length > 0) {
    nowPatternIndex.value = 0
    nextPatternIndex.value = null
    for(let i = 0; i < sequence.length; i++) {
      sequence[i].now = 0
      sequence[i].nextPCed = false
    }
  }
  quarterBeat.value = true
  isPlaying.value = true
  emit("notify-busy-state", isPlaying.value)
}

/**
 * onMIDIStop
 *
 * @param {*} event
 */
function onMIDIStop(event) {
  quarterBeat.value = false
  isPlaying.value = false
  nowPatternIndex.value = null
  emit("notify-busy-state", isPlaying.value)
  // waiting for SH-4d to be ready
  setTimeout(pcFirstStep, 100)
}

/**
 * onAddPattern
 */
function onAddPattern() {
  sequence.push({
    bank: addPatternBank.value,
    no: addPatternNo.value,
    scale: addPatternScale.value,
    step: addPatternStep.value,
    now: 0,
    nextPCed: false,
  })
  pcFirstStep()
  addPatternNo.value++
  if(addPatternNo.value > 16) {
    addPatternNo.value = defaultPattern.no
  }
}

/**
 * onRemovePattern
 *
 * @param {*} index
 */
function onRemovePattern(index) {
  sequence.splice(index, 1)
  addPatternNo.value = sequence.length + 1
}

/**
 * onClear
 */
function onClear() {
  sequence.splice(0, sequence.length);
  addPatternNo.value = defaultPattern.no
}

/**
 * onSave
 *
 * @param {*} index
 */
function onSave(index) {
  let serial = []
  if(sequence.length > 0) {
    // serialize
    for(let i = 0; i < sequence.length; i++) {
      const seq = sequence[i]
      serial.push({
        bank: seq.bank,
        no: seq.no,
        scale: seq.scale,
        step: seq.step,
        now: 0,
        nextPCed: false,
      })
    }
  } else {
    serial = null
  }
  const options = {
    "sendPCLastStep": optionSendPCLastStep.value
  }
  emit("save-and-change", index, serial, options)
}

/**
 * onLoad
 *
 * @param {*} index
 */
 function onLoad(index) {
  const saveState = props.saveState
  if(saveState[index] && saveState[index].sequence != null) {
    onClear()
    for(let i = 0; i < saveState[index].sequence.length; i++) {
      const seq = saveState[index].sequence[i]
      // deserialize
      sequence.push({
        bank: seq.bank,
        no: seq.no,
        scale: seq.scale,
        step: seq.step,
        now: 0,
        nextPCed: false,
      })
    }
    // song options
    const options = saveState[index].options
    optionSendPCLastStep.value = options.sendPCLastStep
  }
  pcFirstStep()
}

/**
 * onDebug
 */
function onDebug() {
  console.log(sequence)
}

/**
 * defaultValue
 */
function defaultValue() {
  addPatternBank.value = defaultPattern.bank
  addPatternNo.value = defaultPattern.no
  addPatternScale.value = defaultPattern.scale
  addPatternStep.value = defaultPattern.step
  for(let i = 1; i <=9; i++) {
    patternBankList.value.push({
      value: i,
      viewValue: `${i}`.padStart(2, 0)
    })
  }
  for(let i = 1; i <=16; i++) {
    patternNoList.value.push({
      value: i,
      viewValue: `${i}`.padStart(2, 0)
    })
  }
  patternScaleList.value = [
    { name: "1/4", value: 4 },
    { name: "1/8", value: 8 },
    { name: "1/16", value: 16 },
    { name: "1/32", value: 32 },
  ]
  optionSendPCLastStep.value = true
}
</script>

<template>
  <div class="alert alert-dark mb-3" role="alert">
    <p class="m-0">
      Activate SH-4d <b class="bi bi-circle-fill mx-1">PATTERN</b>
      and press <b class="bi bi-circle-fill mx-1">START</b>
      to start playback in specified pattern sequence.
    </p>
    <p class="m-0">The first pattern played depends on the SH-4d side specification.</p>
  </div>
  <div class="row justify-content-start">
    <div class="col-3">
      <div class="input-group mb-3">
        <div class="input-group mb-2">
          <button
            v-on:click="onDebug"
            v-bind:disabled="bpm == 0"
            class="btn btn-success"
            type="button">
            <b
              v-if="!isPlaying"
              class="bi bi-circle me-1">
            </b>
            <b
              v-if="quarterBeat && isPlaying"
              class="bi bi-circle-fill me-1">
            </b>
            <b
              v-if="!quarterBeat && isPlaying"
              class="bi bi-circle me-1">
            </b>
            Sync
          </button>
          <div class="input-group-text">BPM</div>
          <input
            v-bind:value="bpm"
            type="text"
            class="form-control"
            readonly>
        </div>
      </div>
    </div>
    <div class="col-3">
      <div class="btn-group me-2" role="group">
        <button
          v-bind:disabled="isPlaying"
          class="btn btn-outline-primary dropdown-toggle" data-bs-toggle="dropdown"
          type="button">
          <b class="bi bi-box-arrow-up-left me-1"></b>
          Save
        </button>
        <ul class="dropdown-menu">
          <li v-for="(seq, index) in saveState">
            <a
              v-on:click="onSave(index)"
              class="dropdown-item"
              href="#">
              {{ seq.name }}
            </a>
          </li>
        </ul>
      </div>
      <div class="btn-group me-2" role="group">
        <button
          v-bind:disabled="isPlaying || saveState.every((state) => state.sequence === null)"
          class="btn btn-outline-primary outline dropdown-toggle" data-bs-toggle="dropdown"
          type="button">
          <b class="bi bi-box-arrow-in-down-right me-1"></b>
          Load
        </button>
        <ul class="dropdown-menu">
          <li v-for="(seq, index) in saveState">
            <a
              v-on:click="onLoad(index)"
              class="dropdown-item"
              v-bind:class="{ 'disabled': seq.sequence == null }"
              href="#">
              {{ seq.name }}
            </a>
          </li>
        </ul>
      </div>
      <button
        v-bind:disabled="isPlaying || sequence.length == 0"
        v-on:click="onClear"
        class="btn btn-outline-primary"
        type="button">
        <i class="bi bi-archive-fill"></i>
        Clear
      </button>
    </div>
    <div class="col-4">
      <div class="btn-group me-2" role="group">
        <div class="form-check form-switch">
          <input
            v-model="optionSendPCLastStep"
            v-bind:disabled="isPlaying"
            type="checkbox"
            class="form-check-input"
            role="switch"
            id="sendPCLastStep">
          <label class="form-check-label" for="sendPCLastStep">Send program change in the last step.</label>
        </div>
      </div>
    </div>
  </div>
  <div class="row justify-content-start">
    <div class="col-6">
      <template v-if="sequence.length <= 0">
        <div class="input-group mb-2">
          <div class="input-group-text col-12">
            <i class="bi bi-box-arrow-in-left me-2"></i>
            Empty
          </div>
        </div>
      </template>
      <template v-if="sequence.length > 0">
        <div
          v-for="(seq, index) in sequence"
          class="input-group mb-2">
          <div class="input-group-text">
            <b
              v-if="nowPatternIndex == index"
              class="bi bi-circle-fill text-success">
            </b>
            <b
              v-if="nowPatternIndex != index"
              class="bi bi-circle text-success">
            </b>
          </div>
          <div class="input-group-text">Pattern</div>
          <select
            v-model="seq.bank"
            v-on:change="pcFirstStep(index == 0)"
            class="form-select">
            <option
              v-for="pattern in patternBankList"
              v-bind:value="pattern.value">
              {{ pattern.viewValue }}
            </option>
          </select>
          <div class="input-group-text">-</div>
          <select
            v-model="seq.no"
            v-on:change="pcFirstStep(index == 0)"
            class="form-select">
            <option
              v-for="pattern in patternNoList"
              v-bind:value="pattern.value">
              {{ pattern.viewValue }}
            </option>
          </select>
          <div class="input-group-text">Step</div>
            <select
            v-model="seq.scale"
            class="form-select">
            <option
              v-for="scale in patternScaleList"
              v-bind:value="scale.value">
              {{ scale.name }}
            </option>
          </select>
          <input
            v-model="seq.step"
            type="number"
            class="form-control"
            placeholder="64">
          <button
            v-bind:disabled="isPlaying"
            v-on:click="onRemovePattern(index)"
            class="btn btn-primary"
            type="button">
            <i class="bi bi-archive-fill"></i>
          </button>
        </div>
        <div class="input-group mb-2">
          <div class="input-group-text col-12">
            <i class="bi bi-layer-forward me-2"></i>
            Loop
          </div>
        </div>
      </template>
    </div>
    <div class="col-6">
      <div class="input-group mb-2">
        <button
          v-on:click="onAddPattern"
          v-bind:disabled="isPlaying"
          class="btn btn-primary"
          type="button">
          <i class="bi bi-box-arrow-left"></i>
          Add
        </button>
        <div class="input-group-text">Pattern</div>
        <select
          v-model="addPatternBank"
          class="form-select">
          <option
            v-for="pattern in patternBankList"
            v-bind:value="pattern.value">
            {{ pattern.viewValue }}
          </option>
        </select>
        <div class="input-group-text">-</div>
        <select
          v-model="addPatternNo"
          class="form-select">
          <option
            v-for="pattern in patternNoList"
            v-bind:value="pattern.value">
            {{ pattern.viewValue }}
          </option>
        </select>
        <div class="input-group-text">Step</div>
        <select
          v-model="addPatternScale"
          class="form-select">
          <option
            v-for="scale in patternScaleList"
            v-bind:value="scale.value">
            {{ scale.name }}
          </option>
        </select>
        <input
          v-model="addPatternStep"
          type="number"
          class="form-control"
          placeholder="64">
      </div>
    </div>
  </div>
</template>
