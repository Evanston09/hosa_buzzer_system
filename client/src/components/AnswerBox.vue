<script setup lang="ts">
import { ref, computed } from 'vue'

const props = defineProps({
    onPress: {
        type: Function,
        required: true
    },
    lightOn: {
        type: Boolean,
        default: false
    },
    width: {
        type: Number,
        default: 120,
    },
    height: {
        type: Number,
        default: 120,
    },
    rotate: {
        type: Number,
        default: 0,
    }
})

// Local ref for button press feedback
const buttonPressed = ref(false);

// Compute the actual light state (prop OR button pressed)
const isLightOn = computed(() => props.lightOn || buttonPressed.value);

// Compute rotation class
const rotationClass = computed(() => {
    if (props.rotate === 180) return 'rotate-180';
    if (props.rotate === 90) return 'rotate-90';
    if (props.rotate === 270) return '-rotate-90';
    return '';
});
</script>
<template>
    <svg xmlns="http://www.w3.org/2000/svg" :class="rotationClass" :width="width" :height="height" viewBox="0 0 120 180">
        <defs>
            <!-- LED glow and highlight -->
            <radialGradient id="ledGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stop-color="#9affb0" />
                <stop offset="60%" stop-color="#46e86c" />
                <stop offset="100%" stop-color="#159c36" />
            </radialGradient>

            <filter id="glow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>

        <!-- Device body -->
        <rect x="20" y="20" width="80" height="140" rx="8" fill="#1a1a1a" stroke="#0a0a0a" stroke-width="2" />

        <!-- Green LED (glowing) -->
        <circle cx="60" cy="50" r="12" :fill="isLightOn ? 'url(#ledGrad)' : '#000000'" :filter="isLightOn ? 'url(#glow)' : ''"/>
        <!-- small bezel -->
        <circle cx="60" cy="50" r="13.5" fill="none" stroke="#4a4a4a" stroke-width="2" opacity="0.7" />

        <!-- Red square button -->
        <rect x="51" y="110" width="18" height="18" rx="3" fill="#e84c3d" stroke="#8e1f16" stroke-width="2"
            @click="props.onPress()"
            @mousedown="buttonPressed = true"
            @mouseup="buttonPressed = false"
        />
    </svg>
</template>
