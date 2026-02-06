import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithCredential,
  signOut,
} from 'firebase/auth';
import { LobbyScreen } from './ui/screens/LobbyScreen';
import { GameScreen } from './ui/screens/GameScreen';
import { ResultModal } from './ui/screens/ResultModal';
import { AuthScreen } from './ui/screens/AuthScreen';
import { GameState, PlayerState, UserProfile } from './game/types';
import { applyAction, initGameState } from './game/logic';
import { getBestMove } from './game/ai';
import { applyGameRewards, createGuestUser, profileFromFirebaseUser, saveUser } from './game/storage';
import { auth } from './game/firebase';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_EXPO_CLIENT_ID = '588391233335-rkljamvr38nhal254hsj7r834nqnlbo8.apps.googleusercontent.com';
const GOOGLE_IOS_CLIENT_ID = 'YOUR_IOS_CLIENT_ID';
const GOOGLE_ANDROID_CLIENT_ID = '588391233335-5oufcu7heqpk4a4t09vkdbaus6g2doua.apps.googleusercontent.com';
const GOOGLE_WEB_CLIENT_ID = '588391233335-rkljamvr38nhal254hsj7r834nqnlbo8.apps.googleusercontent.com';
const USE_GOOGLE_PROXY = false;
const GOOGLE_PROJECT_PROXY = '@yeongwoojeong/mobile';
const toReversedClientId = (clientId: string) => {
  const prefix = clientId.replace('.apps.googleusercontent.com', '');
  return `com.googleusercontent.apps.${prefix}`;
};

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [screen, setScreen] = useState<'auth' | 'lobby' | 'game'>('auth');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [mode, setMode] = useState<'single' | 'local'>('single');
  const [viewerId, setViewerId] = useState(0);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authInfo, setAuthInfo] = useState<string | null>(null);
  const [verifyPending, setVerifyPending] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [nicknamePrompt, setNicknamePrompt] = useState(false);
  const [nicknameDefault, setNicknameDefault] = useState<string | null>(null);
  const [pendingSocialUser, setPendingSocialUser] = useState<any | null>(null);
  const rewardApplied = useRef(false);
  const aiTimer = useRef<NodeJS.Timeout | null>(null);
  const googleClientId =
    Platform.OS === 'android'
      ? GOOGLE_ANDROID_CLIENT_ID
      : Platform.OS === 'ios'
        ? GOOGLE_IOS_CLIENT_ID
        : GOOGLE_WEB_CLIENT_ID;
  const googleRedirectUri =
    Platform.OS === 'android' && !USE_GOOGLE_PROXY
      ? `${toReversedClientId(GOOGLE_ANDROID_CLIENT_ID)}:/oauth2redirect`
      : AuthSession.makeRedirectUri({
          useProxy: USE_GOOGLE_PROXY,
          projectNameForProxy: GOOGLE_PROJECT_PROXY,
          projectId: '19ccb5d1-ff05-40d3-9c32-a683af3a5e6b',
          scheme: Platform.OS === 'android' ? toReversedClientId(GOOGLE_ANDROID_CLIENT_ID) : undefined,
        });
  if (__DEV__) {
    // Debug: confirm we are using the proxy redirect URL
    console.log('[google] redirectUri:', googleRedirectUri, 'useProxy:', USE_GOOGLE_PROXY);
  }
  const googleDiscovery = AuthSession.useAutoDiscovery('https://accounts.google.com');
  const [googleNonce] = useState(() => Math.random().toString(36).slice(2) + Date.now().toString(36));
  const [googleRequest, googleResponse, promptGoogleAuth] = AuthSession.useAuthRequest(
    {
      clientId: googleClientId,
      redirectUri: googleRedirectUri,
      scopes: ['openid', 'profile', 'email'],
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
      extraParams: { nonce: googleNonce },
    },
    googleDiscovery
  );

  useEffect(() => {
    const lock = async () => {
      if (screen === 'auth') {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } else {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      }
    };
    lock();
    return () => {
      ScreenOrientation.unlockAsync();
    };
  }, [screen]);

  useEffect(() => {
    if (mode === 'local' && gameState) {
      setViewerId(gameState.currentPlayerIndex);
    } else {
      setViewerId(0);
    }
  }, [mode, gameState?.currentPlayerIndex]);

  const setAuthMessage = (error: string | null, info: string | null) => {
    setAuthError(error);
    setAuthInfo(info);
  };

  const enterLobbyFromProfile = (profile: UserProfile) => {
    saveUser(profile);
    setUser(profile);
    setVerifyPending(false);
    setVerifyEmail(null);
    setNicknamePrompt(false);
    setNicknameDefault(null);
    setPendingSocialUser(null);
    setAuthMessage(null, null);
    setScreen('lobby');
  };

  const enterLobbyFromFirebase = (firebaseUser: { uid: string; displayName?: string | null; email?: string | null; photoURL?: string | null }) => {
    const profile = profileFromFirebaseUser(firebaseUser);
    enterLobbyFromProfile(profile);
  };

  const enterLobby = (displayName: string) => {
    const guest = createGuestUser();
    guest.displayName = displayName || guest.displayName;
    enterLobbyFromProfile(guest);
  };

  const authErrorMessage = (err: any) => {
    const code = err?.code || '';
    if (code.includes('auth/invalid-email')) return '이메일 형식이 올바르지 않습니다.';
    if (code.includes('auth/user-not-found')) return '해당 이메일로 가입된 계정이 없습니다.';
    if (code.includes('auth/wrong-password')) return '비밀번호가 올바르지 않습니다.';
    if (code.includes('auth/email-already-in-use')) return '이미 사용 중인 이메일입니다.';
    if (code.includes('auth/weak-password')) return '비밀번호는 6자 이상이어야 합니다.';
    if (code.includes('auth/too-many-requests')) return '요청이 많습니다. 잠시 후 다시 시도해주세요.';
    return '로그인에 실패했습니다. 잠시 후 다시 시도해주세요.';
  };

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      handleGoogleResponse(googleResponse);
    } else if (googleResponse?.type === 'error') {
      setAuthMessage('구글 로그인에 실패했습니다.', null);
      setAuthLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleLogin = async () => {
    if (!googleRequest) return;
    setAuthLoading(true);
    setAuthMessage(null, null);
    try {
      const result = await promptGoogleAuth({ useProxy: USE_GOOGLE_PROXY, showInRecents: true });
      if (result.type !== 'success') {
        setAuthLoading(false);
        if (result.type === 'error') {
          setAuthMessage('구글 로그인에 실패했습니다.', null);
        }
        return;
      }
    } catch (err) {
      setAuthMessage(authErrorMessage(err), null);
      setAuthLoading(false);
    }
  };

  const handleGoogleResponse = async (response: AuthSession.AuthSessionResult) => {
    setAuthLoading(true);
    setAuthMessage(null, null);
    try {
      if (response.type !== 'success') {
        setAuthMessage('구글 로그인에 실패했습니다.', null);
        return;
      }
      if (!googleDiscovery?.tokenEndpoint) {
        setAuthMessage('구글 토큰 엔드포인트를 찾을 수 없습니다.', null);
        return;
      }
      const tokenResult = await AuthSession.exchangeCodeAsync(
        {
          clientId: googleClientId,
          code: response.params.code,
          redirectUri: googleRedirectUri,
          extraParams: googleRequest?.codeVerifier
            ? {
                code_verifier: googleRequest.codeVerifier,
              }
            : undefined,
        },
        googleDiscovery
      );
      const idToken = tokenResult.idToken;
      if (!idToken) {
        setAuthMessage('구글 인증 토큰을 받지 못했습니다.', null);
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      const cred = await signInWithCredential(auth, credential);
      setPendingSocialUser(cred.user);
      setNicknameDefault(cred.user.displayName || '');
      setNicknamePrompt(true);
      setScreen('auth');
    } catch (err) {
      setAuthMessage(authErrorMessage(err), null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (Platform.OS !== 'ios') return;
    setAuthLoading(true);
    setAuthMessage(null, null);
    try {
      const appleCred = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (!appleCred.identityToken) {
        setAuthMessage('애플 인증 토큰을 받지 못했습니다.', null);
        return;
      }

      const provider = new OAuthProvider('apple.com');
      const credential = provider.credential({ idToken: appleCred.identityToken });
      const cred = await signInWithCredential(auth, credential);
      let fallbackName = '';
      if (!cred.user.displayName) {
        fallbackName = [appleCred.fullName?.familyName, appleCred.fullName?.givenName].filter(Boolean).join(' ').trim();
      }
      setPendingSocialUser(cred.user);
      setNicknameDefault(cred.user.displayName || fallbackName || '');
      setNicknamePrompt(true);
      setScreen('auth');
    } catch (err: any) {
      if (err?.code !== 'ERR_CANCELED') {
        setAuthMessage(authErrorMessage(err), null);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitNickname = async (nickname: string) => {
    if (!pendingSocialUser) return;
    setAuthLoading(true);
    setAuthMessage(null, null);
    try {
      await updateProfile(pendingSocialUser, { displayName: nickname });
      await pendingSocialUser.reload?.();
      enterLobbyFromFirebase(pendingSocialUser);
    } catch (err) {
      setAuthMessage(authErrorMessage(err), null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCancelNickname = async () => {
    setNicknamePrompt(false);
    setNicknameDefault(null);
    setPendingSocialUser(null);
    try {
      await signOut(auth);
    } catch {
      // ignore
    }
  };

  const handleEmailSignup = async (email: string, password: string, nickname: string) => {
    setAuthLoading(true);
    setAuthMessage(null, null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (nickname) {
        await updateProfile(cred.user, { displayName: nickname });
      }
      await sendEmailVerification(cred.user);
      setVerifyPending(true);
      setVerifyEmail(cred.user.email || email);
      setAuthMessage(null, '인증 메일을 보냈어요. 메일함을 확인해주세요.');
      setScreen('auth');
    } catch (err) {
      setAuthMessage(authErrorMessage(err), null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleEmailLogin = async (email: string, password: string) => {
    setAuthLoading(true);
    setAuthMessage(null, null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!cred.user.emailVerified) {
        setVerifyPending(true);
        setVerifyEmail(cred.user.email || email);
        setAuthMessage(null, '이메일 인증이 필요합니다.');
        setScreen('auth');
        return;
      }
      enterLobbyFromFirebase(cred.user);
    } catch (err) {
      setAuthMessage(authErrorMessage(err), null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    const current = auth.currentUser;
    if (!current) {
      setAuthMessage('인증 상태를 확인할 계정이 없습니다.', null);
      return;
    }
    setAuthLoading(true);
    setAuthMessage(null, null);
    try {
      await current.reload();
      if (current.emailVerified) {
        enterLobbyFromFirebase(current);
        return;
      }
      setAuthMessage('아직 인증이 완료되지 않았습니다.', null);
    } catch (err) {
      setAuthMessage(authErrorMessage(err), null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const current = auth.currentUser;
    if (!current) {
      setAuthMessage('인증 메일을 보낼 계정이 없습니다.', null);
      return;
    }
    setAuthLoading(true);
    setAuthMessage(null, null);
    try {
      await sendEmailVerification(current);
      setAuthMessage(null, '인증 메일을 다시 보냈습니다.');
    } catch (err) {
      setAuthMessage(authErrorMessage(err), null);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleBackToAuth = () => {
    setVerifyPending(false);
    setVerifyEmail(null);
    setAuthMessage(null, null);
  };

  const startSingle = () => {
    if (!user) return;
    const players: PlayerState[] = [
      {
        id: 0,
        uid: user.uid,
        isAI: false,
        name: user.displayName,
        tokens: { White: 0, Blue: 0, Green: 0, Red: 0, Black: 0, Gold: 0 },
        cards: [],
        reserved: [],
        nobles: [],
        points: 0,
      },
      {
        id: 1,
        isAI: true,
        name: 'AI 상무',
        tokens: { White: 0, Blue: 0, Green: 0, Red: 0, Black: 0, Gold: 0 },
        cards: [],
        reserved: [],
        nobles: [],
        points: 0,
      },
    ];
    setMode('single');
    setGameState(initGameState(players));
    rewardApplied.current = false;
    setScreen('game');
  };

  const startLocal = (count: number) => {
    if (!user) return;
    const players: PlayerState[] = Array.from({ length: count }).map((_, i) => ({
      id: i,
      uid: i === 0 ? user.uid : undefined,
      isAI: false,
      name: i === 0 ? user.displayName : `로컬 ${i + 1}`,
      tokens: { White: 0, Blue: 0, Green: 0, Red: 0, Black: 0, Gold: 0 },
      cards: [],
      reserved: [],
      nobles: [],
      points: 0,
    }));
    setMode('local');
    setGameState(initGameState(players));
    rewardApplied.current = false;
    setScreen('game');
  };

  const handleAction = (action: any) => {
    if (!gameState || gameState.winner !== null) return;
    const next = applyAction(gameState, action);
    setGameState(next);
    handleAiTurn(next);
  };

  const handleAiTurn = (state: GameState) => {
    if (mode !== 'single') return;
    if (state.winner !== null) return;
    const current = state.players[state.currentPlayerIndex];
    if (!current.isAI) return;
    if (aiTimer.current) clearTimeout(aiTimer.current);
    const delay = 600 + Math.floor(Math.random() * 600);
    aiTimer.current = setTimeout(() => {
      const move = getBestMove(state);
      const next = applyAction(state, move);
      setGameState(next);
    }, delay);
  };

  useEffect(() => {
    if (!gameState || !user) return;
    if (gameState.winner === null || rewardApplied.current) return;
    const updated = { ...user };
    applyGameRewards(updated, gameState.players.length, gameState.winner, 0);
    saveUser(updated);
    setUser(updated);
    rewardApplied.current = true;
  }, [gameState?.winner]);

  const handleLobby = () => setScreen('lobby');
  const handleRestart = () => {
    if (mode === 'single') startSingle();
    else startLocal(gameState?.players.length || 2);
  };

  return (
    <View style={styles.container}>
      {screen === 'auth' && (
        <AuthScreen
          onEnterLobby={enterLobby}
          onEmailLogin={handleEmailLogin}
          onEmailSignup={handleEmailSignup}
          onGoogleLogin={handleGoogleLogin}
          onAppleLogin={handleAppleLogin}
          onSubmitNickname={handleSubmitNickname}
          onCancelNickname={handleCancelNickname}
          onCheckVerification={handleCheckVerification}
          onResendVerification={handleResendVerification}
          onBackToAuth={handleBackToAuth}
          loading={authLoading}
          error={authError}
          info={authInfo}
          verifyPending={verifyPending}
          verifyEmail={verifyEmail}
          nicknamePrompt={nicknamePrompt}
          nicknameDefault={nicknameDefault}
        />
      )}
      {screen === 'lobby' && (
        <LobbyScreen name={user?.displayName || '마스'} onStartSingle={startSingle} onStartLocal={startLocal} />
      )}
      {screen === 'game' && user && gameState && (
        <>
          <GameScreen user={user} state={gameState} viewerId={viewerId} onAction={handleAction} onExit={handleLobby} />
          <ResultModal state={gameState} onRestart={handleRestart} onLobby={handleLobby} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b1220',
  },
});
