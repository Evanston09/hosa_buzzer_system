<script setup lang="ts">
import { computed } from 'vue'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

const props = defineProps({
    name: {
        type: String,
        required: true
    },
    size: {
        type: String,
        default: 'md',
        validator: (value: string) => ['sm', 'md', 'lg'].includes(value)
    }
})

const initials = computed(() => {
    const firstLetters = props.name.split(" ").map((word) => word[0]);
    return firstLetters.join("");
})

const backgroundColors = computed(() => {
    const colors = [
        "bg-red-600",
        "bg-orange-600",
        "bg-green-600",
        "bg-blue-600",
        "bg-violet-600",
        "bg-slate-600",
    ]

    const generateHash = (string: String) => {
        let hash = 0;
        for (const char of string) {
            hash = (hash << 5) - hash + char.charCodeAt(0);
            hash |= 0; // Constrain to 32bit integer
        }
        return hash;
    };

    const bg = colors[Math.abs(generateHash(props.name)) % colors.length]
    return bg;
})

const sizeClasses = computed(() => {
    const sizes = {
        sm: 'w-8 h-8 text-xs',
        md: 'w-12 h-12 text-base',
        lg: 'w-16 h-16 text-lg'
    }
    return sizes[props.size as keyof typeof sizes]
})
</script>
<template>
    <Avatar :class="sizeClasses + ' shadow-lg'">
        <AvatarFallback :class="backgroundColors" class="font-bold text-white">
            {{ initials }}
        </AvatarFallback>
    </Avatar>
</template>
