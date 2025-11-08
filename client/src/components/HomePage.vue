<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormField, FormItem, FormLabel, FormControl, FormDescription, FormMessage } from '@/components/ui/form'
import { useRouter } from 'vue-router'
import { toTypedSchema } from '@vee-validate/zod'
import * as z from 'zod'
import { useForm } from 'vee-validate'
import {
    PinInput,
    PinInputGroup,
    PinInputSlot,
} from "@/components/ui/pin-input"
import { ref } from 'vue'


const router = useRouter()
const activeTab = ref('join')

const formSchema = toTypedSchema(z.object({
    username: z.string().min(2).max(50),
}))

const form = useForm({
    validationSchema: formSchema,
})

const onSubmit = form.handleSubmit((values) => {
    router.push({
        path: '/lobby',
        query: { name: values.username.trim(), action: 'create' }
    })
})

const onPinComplete = (code: string[]) => {
    form.handleSubmit((values) => {
        if (activeTab.value === 'join' && code.length > 0) {
            router.push({
                path: '/lobby',
                query: {
                    name: values.username.trim(),
                    action: 'join',
                    lobbyCode: code.join("")
                }
            })
        }
    })()
}
</script>

<template>
    <section class="mx-auto flex min-h-screen w-full max-w-2xl flex-col items-center justify-center gap-8 px-4 text-center">
        <h1 class="text-4xl font-bold tracking-tight sm:text-5xl">Mock HOSA Bowl System</h1>

        <Tabs v-model="activeTab" default-value="join" class="w-full">
            <TabsList class="w-full">
                <TabsTrigger value="create">Create Lobby</TabsTrigger>
                <TabsTrigger value="join">Join Lobby</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
                <form @submit.prevent="onSubmit" class="space-y-6 text-left">
                    <FormField v-slot="{ componentField }" name="username">
                        <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                                <Input placeholder="John Doe" v-bind="componentField" />
                            </FormControl>
                            <FormDescription>We use this name in the lobby.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    </FormField>
                    <Button type="submit" class="w-full">
                        Create Lobby
                    </Button>
                </form>
            </TabsContent>
            <TabsContent value="join">
                <div class="space-y-6 text-left">
                    <form @submit.prevent>
                        <FormField v-slot="{ componentField }" name="username">
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="John Doe" v-bind="componentField" />
                                </FormControl>
                                <FormDescription>Enter the name you want other players to see.</FormDescription>
                                <FormMessage />
                            </FormItem>
                        </FormField>
                    </form>

                    <div>
                        <label class="text-sm font-medium text-foreground">Lobby Code</label>
                        <PinInput
                            placeholder="○"
                            @complete="onPinComplete"
                            class="mt-2 justify-between"
                        >
                            <PinInputGroup class="flex gap-3">
                                <PinInputSlot
                                    v-for="(id, index) in 5"
                                    :key="id"
                                    :index="index"
                                    class="h-12 w-12 rounded-lg border bg-background text-xl"
                                />
                            </PinInputGroup>
                        </PinInput>
                        <p class="mt-2 text-sm text-muted-foreground">Share this code with teammates so they can join.</p>
                    </div>
                </div>
            </TabsContent>
        </Tabs>
    </section>
</template>
