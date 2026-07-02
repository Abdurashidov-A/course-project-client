import { Button, Card, Layout, Menu, Space, Typography } from "antd";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import { isAdmin, isCandidate, isRecruiter } from "./utils/roles";

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

function getMenuItems(user) {
  const items = [
    {
      key: "dashboard",
      label: "Dashboard",
    },
    {
      key: "positions",
      label: "Positions",
    },
  ];

  if (isCandidate(user)) {
    items.push(
      {
        key: "my-profile",
        label: "My Profile",
      },
      {
        key: "my-cvs",
        label: "My CVs",
      },
    );
  }

  if (isRecruiter(user)) {
    items.push(
      {
        key: "attribute-library",
        label: "Attribute Library",
      },
      {
        key: "cv-search",
        label: "CV Search",
      },
    );
  }

  if (isAdmin(user)) {
    items.push(
      {
        key: "admin-users",
        label: "Admin Users",
      },
      {
        key: "admin-profiles",
        label: "All Profiles",
      },
    );
  }

  return items;
}

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const menuItems = getMenuItems(user);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          color: "white",
        }}
      >
        <div style={{ fontWeight: 700 }}>CV Management System</div>

        <Space>
          <Text style={{ color: "white" }}>{user.name}</Text>
          <Button onClick={logout}>Logout</Button>
        </Space>
      </Header>

      <Layout>
        <Sider width={240} theme="light">
          <Menu
            mode="inline"
            defaultSelectedKeys={["dashboard"]}
            items={menuItems}
            style={{ height: "100%", borderRight: 0 }}
          />
        </Sider>

        <Content style={{ padding: 24 }}>
          <Card>
            <Space direction="vertical" size="middle">
              <Title level={3}>Welcome, {user.name}</Title>

              <Text>
                Email: <b>{user.email}</b>
              </Text>

              <Text>
                Roles: <b>{user.roles.join(", ")}</b>
              </Text>

              <Text type="secondary">
                This menu is generated based on the current user role.
              </Text>
            </Space>
          </Card>
        </Content>
      </Layout>
    </Layout>
  );
}
