<script setup lang="ts">
import { RouterView } from "vue-router";
import { Toaster } from '@/components/ui/sonner';
import Footer from '@/components/Footer.vue';
import 'vue-sonner/style.css'
</script>

<template>
    <div class="min-h-screen flex flex-col">
        <Toaster position="bottom-right" />
        <main class="grow flex flex-col items-center justify-center">
            <RouterView />
        </main>
        <Footer />
    </div>
</template>
