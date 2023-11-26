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
  if(message) {
    toolTipMIDITab.value = "Connected"
    let toast = new Toast(toastMessage.value)
    toastMessageBody.value = message
    toast.show()
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
function onSaveAndChange(outputDeviceId, inputDeviceId, pcChannel, pcMSB, pcLSB) {
  // send to sequencer
  if(!isBusy.value) {
    sequencer.value.setMIDISetting(
      outputDeviceId,
      inputDeviceId,
      pcChannel,
      pcMSB,
      pcLSB
    )
  }
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
        v-on:saveAndChange="onSaveAndChange"
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
        <strong class="me-auto">MIDI Device</strong>
        <button type="button" class="btn-close" data-bs-dismiss="toast"></button>
      </div>
      <div class="toast-body">
        {{ toastMessageBody }}
      </div>
    </div>
  </div>
</template>
