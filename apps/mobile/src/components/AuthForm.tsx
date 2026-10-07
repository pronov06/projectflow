import { Link } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { loginSchema, registerSchema } from '@pms/shared';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage, getFieldErrors } from '../lib/api';
import { colors } from '../theme';
import { Button, Field } from './ui';

type Errors = Partial<Record<'fullName' | 'email' | 'password' | 'form', string>>;

function firstErrors(issues: { path: PropertyKey[]; message: string }[]): Errors {
  const out: Errors = {};
  for (const i of issues) {
    const key = String(i.path[0]) as keyof Errors;
    out[key] ??= i.message;
  }
  return out;
}

/** Login and registration share one screen layout; `mode` switches the fields and endpoint. */
export function AuthForm({ mode }: { mode: 'login' | 'register' }) {
  const { login, register, notice, clearNotice } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);
  const isLogin = mode === 'login';

  const submit = async () => {
    const parsed = isLogin
      ? loginSchema.safeParse({ email, password })
      : registerSchema.safeParse({ fullName, email, password });
    if (!parsed.success) {
      setErrors(firstErrors(parsed.error.issues));
      return;
    }
    setErrors({});
    setSubmitting(true);
    try {
      if (isLogin) await login(parsed.data as { email: string; password: string });
      else await register(parsed.data as { fullName: string; email: string; password: string });
      clearNotice();
    } catch (err) {
      const fields = getFieldErrors(err);
      setErrors(
        fields.length
          ? firstErrors(fields.map((f) => ({ path: [f.field], message: f.message })))
          : { form: getErrorMessage(err) },
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <View style={styles.logo}>
            <Text style={styles.logoMark}>✓</Text>
          </View>
          <Text style={styles.brand}>ProjectFlow</Text>
          <Text style={styles.title}>{isLogin ? 'Welcome back' : 'Create your account'}</Text>
          <Text style={styles.subtitle}>
            {isLogin ? 'Log in with the same account you use on the web.' : 'One account for web and mobile.'}
          </Text>

          {isLogin && notice ? <Text style={styles.notice}>{notice}</Text> : null}
          {errors.form ? (
            <Text style={styles.formError} accessibilityRole="alert">
              {errors.form}
            </Text>
          ) : null}

          {!isLogin && (
            <Field
              label="Full name"
              value={fullName}
              onChangeText={setFullName}
              autoComplete="name"
              error={errors.fullName}
            />
          )}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            error={errors.email}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isLogin ? 'password' : 'new-password'}
            hint={isLogin ? undefined : 'At least 8 characters, with a letter and a number.'}
            error={errors.password}
            onSubmitEditing={submit}
          />
          <Button title={isLogin ? 'Log in' : 'Create account'} onPress={submit} loading={submitting} />

          <View style={styles.switch}>
            <Text style={styles.switchText}>{isLogin ? 'New to ProjectFlow? ' : 'Already have an account? '}</Text>
            <Link href={isLogin ? '/register' : '/login'} replace style={styles.link}>
              {isLogin ? 'Create an account' : 'Log in'}
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  logoMark: { color: colors.onBrand, fontSize: 30, fontWeight: '400' },
  brand: { textAlign: 'center', fontSize: 20, fontWeight: '400', color: colors.text, marginTop: 8 },
  title: { fontSize: 24, fontWeight: '400', color: colors.text, marginTop: 28 },
  subtitle: { fontSize: 15, color: colors.muted, marginTop: 4, marginBottom: 20 },
  notice: {
    backgroundColor: colors.warningSoft,
    color: colors.warning,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
    fontWeight: '400',
  },
  formError: {
    backgroundColor: colors.dangerSoft,
    color: colors.danger,
    padding: 12,
    borderRadius: 10,
    marginBottom: 14,
  },
  switch: { flexDirection: 'row', justifyContent: 'center', marginTop: 20, flexWrap: 'wrap' },
  switchText: { color: colors.muted, fontSize: 15 },
  link: { color: colors.brand, fontWeight: '400', fontSize: 15 },
});
