export const getFirebaseErrorMessage = (error: any): string => {
  if (!error) return "予期せぬエラーが発生しました。時間を置いて再度お試しください。";

  const errorCode = error.code || '';
  const errorMessage = error.message || '';

  // Auth errors
  switch (errorCode) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return "メールアドレスまたはパスワードが正しくありません。";
    case 'auth/email-already-in-use':
      return "このメールアドレスは既に登録されています。";
    case 'auth/weak-password':
      return "パスワードは6文字以上で入力してください。";
    case 'auth/invalid-email':
      return "不正なメールアドレスの形式です。";
    case 'auth/too-many-requests':
      return "何度も失敗したためアカウントが一時的にロックされています。時間を置いて再度お試しください。";
    case 'auth/operation-not-allowed':
      return "このログイン方法は現在無効になっています。";
    case 'auth/user-disabled':
      return "このアカウントは無効化されています。";
    case 'auth/network-request-failed':
      return "通信エラーが発生しました。ネットワーク接続を確認してください。";
    
    // Firestore & Storage & general permission errors
    case 'permission-denied':
      return "権限がありません。ログイン状態を確認してください。";
    case 'unavailable':
      return "データベースサーバーに接続できません。通信環境を確認してください。";
    case 'not-found':
      return "指定されたデータが見つかりませんでした。";
  }

  // Fallback for known messages if code is not provided but message contains key
  if (errorMessage.includes('permission-denied')) {
    return "権限がありません。ログイン状態を確認してください。";
  }

  return "予期せぬエラーが発生しました。時間を置いて再度お試しください。";
};
