import { Button, Card, Divider, Space, Typography, message } from "antd";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n/I18nProvider";

const { Title, Text } = Typography;

export default function LoginPage() {
  const { login } = useAuth();
  const { t } = useI18n();
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";

  const devUsers = [
    {
      label: t("login.candidate", "Login as Candidate"),
      email: "candidate@test.com",
    },
    {
      label: t("login.recruiter", "Login as Recruiter"),
      email: "recruiter@test.com",
    },
    {
      label: t("login.admin", "Login as Admin"),
      email: "admin@test.com",
    },
  ];

  async function handleLogin(email) {
    try {
      await login(email);
      message.success(t("login.success", "Logged in successfully"));
    } catch (error) {
      console.error(error);
      message.error(t("login.error", "Login failed"));
    }
  }

  function handleOAuthLogin(provider) {
    const oauthUrl = new URL(`/api/auth/oauth/${provider}`, apiBaseUrl);
    window.location.assign(oauthUrl.toString());
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Card style={{ width: 420 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={3}>{t("login.title", "CV Management System")}</Title>
            <Text type="secondary">
              {t("login.subtitle", "Development login for testing roles")}
            </Text>
          </div>

          <Space direction="vertical" style={{ width: "100%" }}>
            <Button block onClick={() => handleOAuthLogin("google")}>
              {t("login.google", "Continue with Google")}
            </Button>
            <Button block onClick={() => handleOAuthLogin("github")}>
              {t("login.github", "Continue with GitHub")}
            </Button>
          </Space>

          <Divider style={{ margin: 0 }}>
            {t("login.orDemo", "Or use demo login")}
          </Divider>

          <Space direction="vertical" style={{ width: "100%" }}>
            {devUsers.map((user) => (
              <Button
                key={user.email}
                block
                type="primary"
                onClick={() => handleLogin(user.email)}
              >
                {user.label}
              </Button>
            ))}
          </Space>
        </Space>
      </Card>
    </div>
  );
}
