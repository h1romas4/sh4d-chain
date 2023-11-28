<script setup>
import { ref, onMounted, reactive } from 'vue'
import Navigation from './components/Navigation.vue'
import Sequencer from './components/Sequencer.vue'
import MIDISetting from './components/MIDISetting.vue'
import { Toast } from 'bootstrap'

/**
 * Vue State
 */
const toastMessage = ref(null) // refs
const toastMessageHead = ref(null)
const toastMessageBody = ref(null)
const activeTab = ref("sequencer")
const toolTipMIDITab = ref("Detecting..")
const toolTipColorMIDITab = ref("success")
const isBusy = ref(null)
const sequencer = ref(null) // refs
const saveStateSequencer = reactive([])
const saveStateMIDISetting = reactive({
  outputDeviceId: null,
  inputDeviceId: null,
  pcChannel: null,
  pcMSB: null,
  pcLSB: null,
})

/**
 * Internal
 */
const STORAGE_KEY_SONG = "Song" + " "
const STORAGE_KEY_SETTING = "Setting"
const MAX_SONG_SIZE = 4

/**
 * Vue Event
 */
onMounted(async () => {
  isBusy.value = false
  // set default sequence save state
  for(let i = 0; i < MAX_SONG_SIZE; i++) {
    saveStateSequencer.push({
      name: `${STORAGE_KEY_SONG}${i + 1}`,
      sequence: null,
      options: null,
    })
  }
  loadState()
})

/**
 * Vue Emets (from MIDISetting)
 *
 * @param {bool} status
 * @param {String} message
 */
function onDetectMIDI(status, message) {
  toastMessageHead.value = "MIDI Setting"
  if(message) {
    toolTipMIDITab.value = "Connected"
    toastMessageBody.value = message
    new Toast(toastMessage.value).show()
  }
  if(!status) {
    toolTipMIDITab.value = "MIDI API Error"
    toolTipColorMIDITab.value = "danger"
    activeTab.value = "midi"
  }
}

/**
 * Vue Emets (from MIDISetting)
 *
 * @param {String} outputDeviceId
 * @param {String} inputDeviceId
 * @param {number} pcChannel
 * @param {number} pcMSB
 * @param {number} pcLSB
 */
function onMIDISaveAndChange(outputDeviceId, inputDeviceId, pcChannel, pcMSB, pcLSB) {
  // send to sequencer
  if(!isBusy.value) {
    sequencer.value.setMIDISetting(
      outputDeviceId,
      inputDeviceId,
      pcChannel,
      pcMSB,
      pcLSB
    )
    toastMessageHead.value = "MIDI Setting"
    toastMessageBody.value = "Setting complited"
    new Toast(toastMessage.value).show()
    // store local storage
    if(window.localStorage) {
      localStorage.setItem(STORAGE_KEY_SETTING, JSON.stringify({
        outputDeviceId,
        inputDeviceId,
        pcChannel,
        pcMSB,
        pcLSB,
      }));
    }
  }
}

/**
 * Vue Emets (from Sequencer)
 *
 * @param {*} index
 * @param {*} sequence
 */
function onSequenceSaveAndChange(index, sequence, options) {
  saveStateSequencer[index].sequence = sequence
  toastMessageHead.value = "Sequencer"
  toastMessageBody.value = "Save complited."
  if(sequence === null) {
    toastMessageBody.value = "Save cleard."
  }
  // store local storage
  if(window.localStorage) {
    const key = `${STORAGE_KEY_SONG}${index + 1}`
    const value = {
      sequence: sequence,
      options: options,
    }
    if(sequence !== null) {
      localStorage.setItem(key, JSON.stringify(value));
    } else {
      localStorage.removeItem(key);
    }
  }
  new Toast(toastMessage.value).show()
}

/**
 * Vue Emets (from Sequencer)
 *
 * @param {bool} state
 */
function onNotifyBusyState(state) {
  isBusy.value = state
}

/**
 * loadState
 */
function loadState() {
  if(!window.localStorage) return
  // MIDI Setting
  const setting = JSON.parse(localStorage.getItem(STORAGE_KEY_SETTING))
  if(setting !== null) {
    saveStateMIDISetting.outputDeviceId = setting['outputDeviceId']
    saveStateMIDISetting.inputDeviceId = setting['inputDeviceId']
    saveStateMIDISetting.pcChannel = setting['pcChannel']
    saveStateMIDISetting.pcMSB = setting['pcMSB']
    saveStateMIDISetting.pcLSB = setting['pcLSB']
  }
  // Sequence
  for(let index = 0; index < MAX_SONG_SIZE; index++) {
    const key = `${STORAGE_KEY_SONG}${index + 1}`
    const song = JSON.parse(localStorage.getItem(key))
    if(song === null) {
      saveStateSequencer[index].sequence = null
      continue
    }
    const sequence = song['sequence']
    if(sequence) {
      saveStateSequencer[index].sequence = sequence
    } else {
      saveStateSequencer[index].sequence = null
    }
    const options = song['options']
    saveStateSequencer[index].options = {
      "sendPCLastStep": options.sendPCLastStep ? true : false
    }
  }
}
</script>

<template>
  <!-- Navigation Tab -->
  <Navigation
    v-bind:tooltip="toolTipMIDITab"
    v-bind:tooltipColor="toolTipColorMIDITab"
    v-bind:active-tab="activeTab" />
  <!-- Sequencer Tab -->
  <div class="tab-content">
    <div class="tab-pane"
      v-bind:class="{ active: activeTab === 'sequencer' }"
      id="sequencerTab"
      role="tabpanel">
      <Sequencer
        ref="sequencer"
        v-bind:saveState="saveStateSequencer"
        v-on:notifyBusyState="onNotifyBusyState"
        v-on:saveAndChange="onSequenceSaveAndChange"
      />
    </div>
  </div>
  <!-- MIDI Tab -->
  <div class="tab-content">
    <div class="tab-pane"
      v-bind:class="{ active: activeTab === 'midi' }"
      id="midiTab"
      role="tabpanel">
      <MIDISetting
        v-bind:isBusy="isBusy"
        v-bind:saveState="saveStateMIDISetting"
        v-on:detectMidi="onDetectMIDI"
        v-on:saveAndChange="onMIDISaveAndChange"
        defaultDeviceName="SH-4d"
      />
    </div>
  </div>
  <!-- Message toast -->
  <div class="toast-container position-fixed bottom-0 end-0 p-3">
    <div ref="toastMessage" id="toastMessage" class="toast" role="alert">
      <div class="toast-header">
        <!-- <i class="bi bi-lightbulb-off-fill"></i> -->
        <i class="bi bi-lightbulb-fill me-1"></i>
        <strong class="me-auto">{{ toastMessageHead }}</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        {{ toastMessageBody }}
      </div>
    </div>
  </div>
</template>
