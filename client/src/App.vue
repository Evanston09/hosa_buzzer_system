<script setup lang="ts">
import { RouterView } from "vue-router";
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'vue-sonner';
import 'vue-sonner/style.css'
</script>

<template>
    <div class="min-h-screen flex justify-center flex-col items-center">

        <Toaster position="bottom-right" />
        <RouterView />
    </div>
</template>
