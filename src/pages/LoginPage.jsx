import {
  Button,
  Card,
  Divider,
  Form,
  Input,
  Space,
  Typography,
  message,
} from "antd";
import { GithubOutlined, GoogleOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { useI18n } from "../i18n/i18nContext";

const { Title } = Typography;

export default function LoginPage({ embedded = false }) {
  const { loginWithTestCredentials } = useAuth();
  const { t } = useI18n();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [loadingAction, setLoadingAction] = useState(null);
  const apiBaseUrl =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
  const isLoginPending = loadingAction !== null;

  async function handleNamedLogin(values, actionKey = "named-login") {
    if (isLoginPending) {
      return;
    }

    setLoadingAction(actionKey);

    try {
      await loginWithTestCredentials(values.login, values.password);
      message.success(t("login.success", "Logged in successfully"));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      if (error.response?.status === 401) {
        message.error(
          t("login.invalidCredentials", "Invalid login or password"),
        );
      } else {
        message.error(
          error.response?.data?.message || t("login.error", "Login failed"),
        );
      }
    } finally {
      setLoadingAction(null);
    }
  }

  function handleOAuthLogin(provider) {
    if (isLoginPending) {
      return;
    }

    const oauthUrl = new URL(`/api/auth/oauth/${provider}`, apiBaseUrl);
    setLoadingAction(provider);

    window.setTimeout(() => {
      window.location.assign(oauthUrl.toString());
    }, 50);
  }

  return (
    <div
      className="login-page"
      style={{
        minHeight: embedded ? "auto" : "100vh",
        display: "grid",
        placeItems: "center",
      }}
    >
      <Card
        className="login-page__card"
        style={{ width: "100%", maxWidth: 520 }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={3}>{t("login.title", "CV Management System")}</Title>
          </div>

          <Form
            form={form}
            layout="vertical"
            onFinish={(values) => handleNamedLogin(values)}
          >
            <Form.Item
              label={t("login.loginLabel", "Login")}
              name="login"
              rules={[
                {
                  required: true,
                  message: t("login.loginRequired", "Login is required"),
                },
              ]}
            >
              <Input
                autoComplete="username"
                disabled={isLoginPending}
                placeholder="JohnRecruiter"
              />
            </Form.Item>

            <Form.Item
              label={t("login.password", "Password")}
              name="password"
              rules={[
                {
                  required: true,
                  message: t("login.passwordRequired", "Password is required"),
                },
              ]}
            >
              <Input.Password
                autoComplete="current-password"
                disabled={isLoginPending}
                placeholder={t("login.password", "Password")}
              />
            </Form.Item>

            <Button
              block
              type="primary"
              htmlType="submit"
              loading={loadingAction === "named-login"}
              disabled={isLoginPending && loadingAction !== "named-login"}
            >
              {t("login.signIn", "Sign in")}
            </Button>
          </Form>

          <Divider style={{ margin: 0 }}>
            {t("login.orContinueWith", "Or continue with")}
          </Divider>

          <Space direction="vertical" style={{ width: "100%" }}>
            <Button
              block
              icon={<GoogleOutlined />}
              loading={loadingAction === "google"}
              disabled={isLoginPending && loadingAction !== "google"}
              onClick={() => handleOAuthLogin("google")}
            >
              {t("login.google", "Continue with Google")}
            </Button>
            <Button
              block
              icon={<GithubOutlined />}
              loading={loadingAction === "github"}
              disabled={isLoginPending && loadingAction !== "github"}
              onClick={() => handleOAuthLogin("github")}
            >
              {t("login.github", "Continue with GitHub")}
            </Button>
          </Space>

          <Divider style={{ margin: 0 }} />
        </Space>
      </Card>
    </div>
  );
}
