import { Alert, Button, Card, Space, Spin, Typography } from "antd";
import { useEffect, useMemo, useState } from "react";
import { completeOAuthLogin } from "../api/authApi";
import { useAuth } from "../context/authContext";
import { useI18n } from "../i18n/i18nContext";

const { Title, Text } = Typography; 

export function OAuthCallbackPage() {
  const { setAuthenticatedUser } = useAuth();
  const { t } = useI18n();
  const token = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("token") || "";
  }, []);

  const callbackError = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get("error") || "";
  }, []);
  const [errorMessage, setErrorMessage] = useState(
    () =>
      callbackError ||
      (!token ? t("login.oauthFailed", "OAuth login failed") : ""),
  );

  useEffect(() => {
    if (callbackError || !token) {
      return;
    }

    let isActive = true;

    async function finishOAuthLogin() {
      try {
        const user = await completeOAuthLogin(token);

        if (!isActive || !user) {
          return;
        }

        setAuthenticatedUser(user);
        window.location.replace("/");
      } catch (error) {
        if (!isActive) {
          return;
        }

        setErrorMessage(
          error.response?.data?.message ||
            t("login.oauthFailed", "OAuth login failed"),
        );
      }
    }

    finishOAuthLogin();

    return () => {
      isActive = false;
    };
  }, [callbackError, setAuthenticatedUser, t, token]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Card style={{ width: 420 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={3}>{t("login.title", "CV Management System")}</Title>
            <Text type="secondary">
              {t("login.signingIn", "Signing you in...")}
            </Text>
          </div>

          {errorMessage ? (
            <>
              <Alert
                type="error"
                message={t("login.oauthFailed", "OAuth login failed")}
                description={errorMessage}
                showIcon
              />
              <Button block onClick={() => window.location.replace("/")}>
                {t("login.backToLogin", "Back to login")}
              </Button>
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "12px 0" }}>
              <Spin />
            </div>
          )}
        </Space>
      </Card>
    </div>
  );
}
