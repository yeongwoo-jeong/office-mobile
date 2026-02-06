import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

type AuthScreenProps = {
  onEnterLobby?: (displayName: string) => void;
  onEmailLogin?: (email: string, password: string) => void;
  onEmailSignup?: (email: string, password: string, nickname: string) => void;
  onGoogleLogin?: () => void;
  onAppleLogin?: () => void;
  onSubmitNickname?: (nickname: string) => void;
  onCancelNickname?: () => void;
  onCheckVerification?: () => void;
  onResendVerification?: () => void;
  onBackToAuth?: () => void;
  loading?: boolean;
  error?: string | null;
  info?: string | null;
  verifyPending?: boolean;
  verifyEmail?: string | null;
  nicknamePrompt?: boolean;
  nicknameDefault?: string | null;
};

export const AuthScreen = ({
  onEnterLobby,
  onEmailLogin,
  onEmailSignup,
  onGoogleLogin,
  onAppleLogin,
  onSubmitNickname,
  onCancelNickname,
  onCheckVerification,
  onResendVerification,
  onBackToAuth,
  loading = false,
  error,
  info,
  verifyPending = false,
  verifyEmail,
  nicknamePrompt = false,
  nicknameDefault,
}: AuthScreenProps) => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [nickname, setNickname] = useState('마스');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const panelWidth = isLandscape ? Math.min(440, width * 0.48) : Math.min(440, width * 0.9);

  const canEnterGuest = nickname.trim().length > 0;
  const canSubmitNickname = nickname.trim().length > 0;
  const canLogin = email.trim().length > 0 && password.trim().length > 0;
  const canSignup =
    email.trim().length > 0 && password.trim().length >= 6 && password === password2 && nickname.trim().length > 0;

  useEffect(() => {
    if (!nicknamePrompt) return;
    const next = nicknameDefault?.trim();
    setNickname(next && next.length > 0 ? next : '마스');
  }, [nicknamePrompt, nicknameDefault]);

  const enterLobby = () => {
    if (!canEnterGuest) return;
    onEnterLobby?.(nickname.trim());
  };

  const submitLogin = () => {
    if (!canLogin || loading) return;
    onEmailLogin?.(email.trim(), password);
  };

  const submitSignup = () => {
    if (!canSignup || loading) return;
    onEmailSignup?.(email.trim(), password, nickname.trim());
  };

  return (
    <SafeAreaView style={styles.safe}>
      <LinearGradient colors={[colors.bgTop, colors.bgBottom]} style={styles.container}>
        <View style={styles.spotA} />
        <View style={styles.spotB} />

        <KeyboardAvoidingView
          style={styles.keyboard}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          enabled={Platform.OS === 'ios'}
          keyboardVerticalOffset={0}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { minHeight: height }]}
            showsVerticalScrollIndicator
            keyboardShouldPersistTaps="handled"
          >
            <View style={[styles.panel, { width: panelWidth }]}>
              <Text style={styles.logo}>OFFICE QUEST</Text>
              <Text style={styles.tag}>업무 전쟁에 합류하기</Text>

              {!!error && <Text style={styles.errorText}>{error}</Text>}
              {loading && <Text style={styles.infoText}>처리 중...</Text>}
              {!!info && <Text style={styles.infoText}>{info}</Text>}

              {verifyPending ? (
                <View style={styles.verifyBox}>
                  <Text style={styles.verifyTitle}>이메일 인증이 필요합니다</Text>
                  <Text style={styles.verifyDesc}>메일함에서 인증 링크를 눌러주세요.</Text>
                  {!!verifyEmail && <Text style={styles.verifyEmail}>{verifyEmail}</Text>}

                  <TouchableOpacity style={styles.primaryBtn} activeOpacity={0.9} onPress={onCheckVerification}>
                    <Text style={styles.primaryText}>인증 완료 확인</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.secondaryBtn} activeOpacity={0.9} onPress={onResendVerification}>
                    <Text style={styles.secondaryText}>인증 메일 다시 보내기</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.8} onPress={onBackToAuth}>
                    <Text style={styles.ghostText}>다른 계정으로 돌아가기</Text>
                  </TouchableOpacity>
                </View>
              ) : nicknamePrompt ? (
                <View style={styles.verifyBox}>
                  <Text style={styles.verifyTitle}>닉네임을 설정해주세요</Text>
                  <Text style={styles.verifyDesc}>로비에서 표시될 이름입니다.</Text>

                  <View style={styles.field}>
                    <Text style={styles.label}>닉네임</Text>
                    <TextInput
                      value={nickname}
                      onChangeText={setNickname}
                      placeholder="로비에서 보일 이름"
                      placeholderTextColor="rgba(255,255,255,0.45)"
                      disableFullscreenUI
                      returnKeyType="done"
                      style={styles.input}
                    />
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, !canSubmitNickname && styles.btnDisabled]}
                    activeOpacity={0.9}
                    disabled={!canSubmitNickname || loading}
                    onPress={() => onSubmitNickname?.(nickname.trim())}
                  >
                    <Text style={styles.primaryText}>닉네임 저장하고 시작</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.8} onPress={onCancelNickname}>
                    <Text style={styles.ghostText}>뒤로가기</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.tabs}>
                    <TouchableOpacity
                      style={[styles.tab, mode === 'login' && styles.tabActive]}
                      activeOpacity={0.85}
                      onPress={() => setMode('login')}
                    >
                      <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>로그인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.tab, mode === 'signup' && styles.tabActive]}
                      activeOpacity={0.85}
                      onPress={() => setMode('signup')}
                    >
                      <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>회원가입</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.form}>
                    {mode === 'signup' && (
                      <View style={styles.field}>
                        <Text style={styles.label}>닉네임</Text>
                        <TextInput
                          value={nickname}
                          onChangeText={setNickname}
                          placeholder="로비에서 보일 이름"
                          placeholderTextColor="rgba(255,255,255,0.45)"
                          disableFullscreenUI
                          returnKeyType="next"
                          style={styles.input}
                        />
                      </View>
                    )}

                    <View style={styles.field}>
                      <Text style={styles.label}>이메일</Text>
                      <TextInput
                        value={email}
                        onChangeText={setEmail}
                        placeholder="name@company.com"
                        placeholderTextColor="rgba(255,255,255,0.45)"
                        autoCapitalize="none"
                        keyboardType="email-address"
                        disableFullscreenUI
                        returnKeyType="next"
                        style={styles.input}
                      />
                    </View>

                    <View style={styles.field}>
                      <Text style={styles.label}>비밀번호</Text>
                      <TextInput
                        value={password}
                        onChangeText={setPassword}
                        placeholder="비밀번호 입력 (6자 이상)"
                        placeholderTextColor="rgba(255,255,255,0.45)"
                        secureTextEntry
                        disableFullscreenUI
                        returnKeyType={mode === 'signup' ? 'next' : 'done'}
                        style={styles.input}
                      />
                    </View>

                    {mode === 'signup' && (
                      <View style={styles.field}>
                        <Text style={styles.label}>비밀번호 확인</Text>
                        <TextInput
                          value={password2}
                          onChangeText={setPassword2}
                          placeholder="비밀번호 재입력"
                          placeholderTextColor="rgba(255,255,255,0.45)"
                          secureTextEntry
                          disableFullscreenUI
                          returnKeyType="done"
                          style={styles.input}
                        />
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={[styles.primaryBtn, mode === 'login' ? !canLogin && styles.btnDisabled : !canSignup && styles.btnDisabled]}
                    activeOpacity={0.9}
                    disabled={mode === 'login' ? !canLogin || loading : !canSignup || loading}
                    onPress={mode === 'login' ? submitLogin : submitSignup}
                  >
                    <Text style={styles.primaryText}>{mode === 'login' ? '로그인 후 입장' : '회원가입 후 입장'}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.ghostBtn} activeOpacity={0.8} onPress={enterLobby} disabled={loading}>
                    <Text style={styles.ghostText}>게스트로 시작하기</Text>
                  </TouchableOpacity>

                  <View style={styles.dividerRow}>
                    <View style={styles.divider} />
                    <Text style={styles.dividerText}>간편 로그인</Text>
                    <View style={styles.divider} />
                  </View>

                  <View style={styles.socialRow}>
                    <TouchableOpacity
                      style={[styles.socialBtn, styles.google]}
                      activeOpacity={0.9}
                      onPress={onGoogleLogin}
                      disabled={loading}
                    >
                      <Text style={styles.socialText}>Google</Text>
                    </TouchableOpacity>
                    {Platform.OS === 'ios' && (
                      <TouchableOpacity
                        style={[styles.socialBtn, styles.apple]}
                        activeOpacity={0.9}
                        onPress={onAppleLogin}
                        disabled={loading}
                      >
                        <Text style={styles.socialText}>Apple</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity style={[styles.socialBtn, styles.kakao]} activeOpacity={0.9} disabled>
                      <Text style={styles.socialTextDark}>Kakao</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.socialBtn, styles.naver]} activeOpacity={0.9} disabled>
                      <Text style={styles.socialText}>Naver</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.footnote}>Google / Apple 로그인 지원</Text>
                </>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bgBottom },
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  spotA: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: '#4CC3FF',
    opacity: 0.12,
    top: -60,
    left: 40,
  },
  spotB: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: '#3A8BFF',
    opacity: 0.1,
    bottom: -40,
    right: -60,
  },
  panel: {
    backgroundColor: 'rgba(5,18,35,0.82)',
    borderRadius: 22,
    paddingHorizontal: 28,
    paddingVertical: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    gap: 12,
  },
  logo: {
    color: '#E6F1FF',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 1.5,
  },
  tag: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 12,
    marginBottom: 6,
  },
  errorText: {
    color: '#FF8080',
    textAlign: 'center',
    fontSize: 12,
  },
  infoText: {
    color: '#8FD3FF',
    textAlign: 'center',
    fontSize: 12,
  },
  verifyBox: {
    gap: 10,
    paddingTop: 4,
  },
  verifyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  verifyDesc: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    fontSize: 12,
  },
  verifyEmail: {
    color: '#FFD54A',
    textAlign: 'center',
    fontSize: 12,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  tabText: {
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '700',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  form: {
    gap: 10,
  },
  field: {
    gap: 6,
  },
  label: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    letterSpacing: 0.4,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    backgroundColor: 'rgba(10,20,40,0.8)',
  },
  primaryBtn: {
    marginTop: 6,
    backgroundColor: '#FFD54A',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  primaryText: {
    color: '#1C1605',
    fontWeight: '900',
    fontSize: 14,
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#CFE9FF',
    fontWeight: '700',
    fontSize: 12,
  },
  ghostBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  ghostText: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '700',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 6,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  dividerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  socialBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  socialText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  socialTextDark: {
    color: '#1B1B1B',
    fontWeight: '800',
    fontSize: 12,
  },
  google: {
    backgroundColor: '#1E2A44',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  kakao: {
    backgroundColor: '#FEE500',
  },
  apple: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  naver: {
    backgroundColor: '#21C163',
  },
  footnote: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.45)',
    fontSize: 10,
  },
});
