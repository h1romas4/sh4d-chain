<script setup>
import { ref, onMounted, onUnmounted, getCurrentInstance } from 'vue'
import { Modal } from 'bootstrap'

/**
 * External State (WEBMIDI.js Singleton)
 * @type {WebMidi}
 */
const $webmidi = getCurrentInstance().appContext.config.globalProperties.$webmidi

/**
 * Vue Component Props
 */
const props = defineProps([
  'isBusy',
  'defaultDeviceName',
  'saveState',
])

/**
 * Vue Emets
 */
const emit = defineEmits([
  'detect-midi',
  'save-and-change',
])

/**
 * Vue State
 */
const midiInputList = ref(null)
const midiInputDevice = ref(null)
const midiOutputList = ref(null)
const midiOutputDevice = ref(null)
const outputChannelList = ref(null)
const outputChannel = ref(null)
const pcMSB = ref(null)
const pcLSB = ref(null)
const errorMessage = ref("")
const dialogError = ref(null) // DOM refs (for bootstrap)
const disabledMIDI = ref(true)

/**
 * Vue Event
 */
onMounted(async () => {
  try {
    await $webmidi.enable({sysex: true})
    configure()
  } catch(err) {
    emit('detect-midi', false, null)
    const modal = new Modal(dialogError.value, {keyboard: true})
    errorMessage.value = err
    modal.show()
  }
})

/**
 * Configure
 */
function configure() {
  let message = ""
  if(setDefaultSetting()) {
    const detectInput = detectDevice(
      props.defaultDeviceName,
      midiInputList,
      midiInputDevice)
    const detectOutput = detectDevice(
      props.defaultDeviceName,
      midiOutputList,
      midiOutputDevice)
    if(detectInput && detectOutput) {
      message = "Detect Roland MIDI Device. Ready to start!"
    } else {
      message = "Detect MIDI Device. MIDI configuration may be required."
    }
    disabledMIDI.value = false
    emit('save-and-change',
      midiInputDevice.value,
      midiOutputDevice.value,
      outputChannel.value,
      pcMSB.value,
      pcLSB.value)
  } else {
    message = "MIDI device not found."
  }
  emit('detect-midi', true, message)
}

/**
 * Set default settings
 *
 * @returns {bool} detect MIDI device
 */
function setDefaultSetting() {
  const midiInputDetect = importMIDIDevice(
    $webmidi.outputs,
    midiInputList,
    midiInputDevice)
  const midiOutputDetect = importMIDIDevice(
    $webmidi.inputs,
    midiOutputList,
    midiOutputDevice)
  outputChannelList.value = [...(Array(16).keys())].map(i => i + 1) // 1-16
  outputChannel.value = 16
  pcMSB.value = 85
  pcLSB.value = 0
  if(midiInputDetect && midiOutputDetect) {
    return true
  }
  return false
}

/**
 * Import MIDI device from Web MIDI API
 *
 * @param {WebMidi.inputs | WebMidi.outputs} devices
 * @param {*} list
 * @param {*} model
 */
function importMIDIDevice(devices, list, model) {
  list.value = []
  devices.forEach(device => {
    list.value.push({
      id: device.id,
      manufacturer: device.manufacturer,
      name: device.name,
    })
  })
  if(list.value.length <= 0) {
    model.value = null
    return false
  }
  // select last device
  model.value = list.value[list.value.length - 1].id
  return true
}

/**
 * Detect device by name
 *
 * @param {*} name
 * @param {*} list
 * @param {*} model
 */
function detectDevice(name, list, model) {
  let index = list.value.findIndex(device =>
    device.name.startsWith(name)
  )
  if(index == -1) {
    return false
  }
  model.value = list.value[index].id
  return true
}

/**
 * onSaveChange
 */
function onSaveChange() {
  emit('save-and-change',
    midiInputDevice.value,
    midiOutputDevice.value,
    outputChannel.value,
    pcMSB.value,
    pcLSB.value)
}
</script>

<template>
  <div class="alert alert-dark mb-3" role="alert">
    <p>The following settings in SH-4d will synchronize the application.</p>
    <p class="m-0 font-monospace">- SYSTEM SETTINGS - TEMPO/SYNC - Sync Out - USB</p>
    <p class="m-0 font-monospace">- SYSTEM SETTINGS - MIDI - Ctrl Ch - 16</p>
  </div>
  <div class="mb-3">
    <label for="formGroupMIDI" class="form-label">MIDI Input</label>
    <select v-model="midiInputDevice" class="form-select">
      <option
        v-for="device in midiInputList"
        v-bind:value="device.id">
        {{ device.name }}
      </option>
    </select>
  </div>
  <div class="mb-3">
    <label for="formGroupMIDI" class="form-label">MIDI Output</label>
    <select
      v-model="midiOutputDevice"
      class="form-select">
      <option
        v-for="device in midiOutputList"
        v-bind:value="device.id">
        {{ device.name }}
      </option>
    </select>
  </div>
  <div class="mb-3">
    <label for="formGroupMIDI" class="form-label">CC/PC Send MIDI channel</label>
    <select
      v-model="outputChannel"
      class="form-select">
      <option
        v-for="channel in outputChannelList"
        v-bind:value="channel">
        {{ channel }}
      </option>
    </select>
  </div>
  <div class="mb-3 col-3">
    <label for="formGroupMIDI" class="form-label">PC (Advanced)</label>
    <div class="input-group">
      <div class="input-group-text">MSB</div>
      <input
        v-model="pcMSB"
        type="number"
        class="form-control"
        placeholder="85">
      <div class="input-group-text">LSB</div>
      <input
        v-model="pcLSB"
        type="number"
        class="form-control"
        placeholder="0">
    </div>
  </div>
  <div class="my-4 text-end">
    <button
      v-bind:disabled="disabledMIDI"
      v-on:click="configure()"
      class="btn btn-primary me-3"
      type="button">
      Reset
    </button>
    <button
      v-bind:disabled="disabledMIDI || props.isBusy"
      v-on:click="onSaveChange()"
      class="btn btn-primary me-3"
      type="button">
      Save & Change
    </button>
  </div>
  <!-- Error Modal -->
  <div ref="dialogError" class="modal fade" id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" tabindex="-1" aria-labelledby="staticBackdropLabel" aria-hidden="true">
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h1 class="modal-title fs-5" id="staticBackdropLabel">Web MIDI API error</h1>
          <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
        </div>
        <div class="modal-body">
          <p>Could not open Web MIDI API, try a Chromium-based browser such as Microsoft Edge.</p>
          <p>Reload your web browser when ready.</p>
          <p>{{ errorMessage }}</p>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn btn-primary" data-bs-dismiss="modal">Close</button>
        </div>
      </div>
    </div>
  </div>
</template>
