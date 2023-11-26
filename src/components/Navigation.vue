<script setup>
/**
 * Vue Component Props
 */
defineProps([
  'tooltip',
  'tooltipColor',
  'activeTab',
])
</script>

<template>
<ul class="nav nav-tabs mb-4" role="tablist">
  <li class="nav-item" role="presentation">
    <button class="nav-link"
      :class="{ active: activeTab === 'sequencer' }"
      data-bs-toggle="tab"
      data-bs-target="#sequencerTab"
      type="button"
      role="tab">
      Sequencer
    </button>
  </li>
  <li class="nav-item" role="presentation">
    <button class="nav-link"
      :class="{ active: activeTab === 'midi' }"
      data-bs-toggle="tab"
      data-bs-target="#midiTab"
      type="button"
      role="tab">
      MIDI
      <!-- <span class="badge bg-danger">Danger</span> -->
      <span class="badge rounded-pill bg-success"
        v-bind:class="{
          'bg-success': tooltipColor === 'success',
          'bg-danger': tooltipColor === 'danger' }">
        {{ tooltip }}
      </span>
    </button>
  </li>
</ul>
</template>
