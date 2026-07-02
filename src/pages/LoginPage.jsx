import { Button, Card, Space, Typography, message } from "antd";
import { useAuth } from "../context/AuthContext";

const { Title, Text } = Typography;

const devUsers = [
  {
    label: "Login as Candidate",
    email: "candidate@test.com",
  },
  {
    label: "Login as Recruiter",
    email: "recruiter@test.com",
  },
  {
    label: "Login as Admin",
    email: "admin@test.com",
  },
];

export default function LoginPage() {
  const { login } = useAuth();

  async function handleLogin(email) {
    try {
      await login(email);
      message.success("Logged in successfully");
    } catch (error) {
      console.error(error);
      message.error("Login failed");
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Card style={{ width: 420 }}>
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div>
            <Title level={3}>CV Management System</Title>
            <Text type="secondary">Development login for testing roles</Text>
          </div>

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
