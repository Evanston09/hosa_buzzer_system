<script setup lang="ts">
import { computed } from 'vue'
// @ts-ignore
import SevenSegmentDisplay from "vue-ts-seven-segment-display";

const props = defineProps({
    time: {
        type: Number,
        required: true
    },
    mode: {
        type: String,
        required: true
    }
})

// Left display value (minutes or seconds)
const leftValue = computed(() => {
  if (props.mode === 'minutes:seconds') {
    return Math.floor(props.time / 60) // minutes
  } else {
    return Math.floor(props.time / 100) // seconds
  }
})

// Right display value (seconds or centiseconds)
const rightValue = computed(() => {
  if (props.mode === 'minutes:seconds') {
    return props.time % 60 // seconds
  } else {
    return props.time % 100 // centiseconds
  }
})
</script>

<template>
  <svg width="400" height="160" viewBox="0 0 400 160">
    <rect
      x="0"
      y="0"
      width="400"
      height="160"
      rx="8"
      fill="#9ca3af"
      stroke="#6b7280"
      stroke-width="2"
    />

    <rect
      x="12"
      y="12"
      width="376"
      height="136"
      rx="4"
      fill="#000000"
    />

    <!-- Content using foreignObject -->
    <foreignObject x="12" y="12" width="376" height="136">
      <div xmlns="http://www.w3.org/1999/xhtml" class="flex items-center justify-center h-full">
        <SevenSegmentDisplay
          :value="String(leftValue).padStart(2, '0')"
          height="120"
          bgColor="#9ca3af"
          color="red"
          :segmentSize="2"
        />
        <span class="text-9xl mx-2 leading-none flex items-center -translate-y-3 text-red-600">:</span>
        <SevenSegmentDisplay
          :value="String(rightValue).padStart(2, '0')"
          height="120"
          color="red"
          bgColor="#9ca3af"
          :segmentSize="2"
        />
      </div>
    </foreignObject>
  </svg>
</template>
