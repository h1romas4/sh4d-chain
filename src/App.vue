<script setup>
import { ref, onMounted } from 'vue'
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

/**
 * Vue Event
 */
onMounted(async () => {
  isBusy.value = false
})

/**
 * Vue Emets (from MIDISetting)
 *
 * @param {bool} status
 * @param {String} message
 */
function onDetectMidi(status, message) {
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
  }
}

/**
 * Vue Emets (from Sequencer)
 *
 * @param {*} sequence
 */
function onSequenceSaveAndChange(sequence) {
  console.log(sequence)
  toastMessageHead.value = "Sequencer"
  // toastMessageBody.value = "Save complited"
  toastMessageBody.value = "Sorry, not implimented yet!"
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
        v-on:detectMidi="onDetectMidi"
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
