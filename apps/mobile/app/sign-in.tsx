import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from "react-native";
import { Redirect, Link, useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors, styles } from "@/lib/theme";

const schema = z.object({ email: z.string().email("Enter a valid email address"), password: z.string().min(1, "Enter your password") });
type FormValues = z.infer<typeof schema>;

export default function SignIn() {
  const { session, signIn } = useAuth();
  const router = useRouter();
  const [message, setMessage] = useState("");
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  if (session) return <Redirect href="/" />;
  const submit = async ({ email, password }: FormValues) => { setMessage(""); const error = await signIn(email, password); if (error) setMessage(error); else router.replace("/"); };
  return <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.screen}><View style={{ flex: 1, justifyContent: "center", padding: 24 }}><Text style={styles.eyebrow}>QUICKOLA CLEANER APP</Text><Text style={[styles.title, { marginTop: 10 }]}>Welcome back</Text><Text style={[styles.body, { marginTop: 8, marginBottom: 28 }]}>Sign in with your existing Quickola cleaner account.</Text><View style={styles.card}><Text style={label}>Email</Text><Controller control={control} name="email" render={({ field: { onChange, onBlur, value } }) => <TextInput autoCapitalize="none" autoComplete="email" keyboardType="email-address" value={value} onBlur={onBlur} onChangeText={onChange} style={input} placeholder="you@example.com" placeholderTextColor="#9aa5b5" />} />{errors.email && <Text style={error}>{errors.email.message}</Text>}<Text style={[label, { marginTop: 15 }]}>Password</Text><Controller control={control} name="password" render={({ field: { onChange, onBlur, value } }) => <TextInput secureTextEntry autoComplete="password" value={value} onBlur={onBlur} onChangeText={onChange} style={input} placeholder="Your password" placeholderTextColor="#9aa5b5" />} />{errors.password && <Text style={error}>{errors.password.message}</Text>}<Text accessibilityLiveRegion="polite" style={{ color: colors.danger, minHeight: message ? 24 : 8, marginTop: 10 }}>{message}</Text><Pressable accessibilityRole="button" disabled={isSubmitting} onPress={() => void handleSubmit(submit)()} style={[button, isSubmitting && { opacity: 0.5 }]}><Text style={buttonText}>{isSubmitting ? "Signing in…" : "Sign in"}</Text></Pressable><Link href="/forgot-password" style={link}>Forgot password?</Link><Text style={or}>New to Quickola? <Link href="/create-account" style={link}>Create cleaner account</Link></Text></View></View></KeyboardAvoidingView>;
}

const label = { color: colors.ink, fontSize: 14, fontWeight: "700" as const };
const input = { minHeight: 50, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 14, color: colors.ink, fontSize: 16, marginTop: 7 };
const error = { color: colors.danger, fontSize: 12, marginTop: 5 };
const button = { minHeight: 52, borderRadius: 11, backgroundColor: colors.navy, alignItems: "center" as const, justifyContent: "center" as const, marginTop: 8 };
const buttonText = { color: colors.white, fontSize: 16, fontWeight: "800" as const };
const link = { color: colors.blue, fontSize: 14, fontWeight: "800" as const, textAlign: "center" as const };
const or = { color: colors.muted, fontSize: 14, textAlign: "center" as const, marginTop: 18 };
