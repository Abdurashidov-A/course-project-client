import { Button, Layout, Menu, Space, Typography } from "antd";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import { isAdmin, isCandidate, isRecruiter } from "./utils/roles";
import PagePlaceholder from "./components/PagePlaceholder";
import { AttributeLibraryPage } from "./pages/AttributeLibraryPage";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function getMenuItems(user) {
  const items = [
    {
      key: "dashboard",
      label: "Dashboard",
      title: "Dashboard",
      description: "Main overview page with statistics and latest positions.",
    },
    {
      key: "positions",
      label: "Positions",
      title: "Positions",
      description: "Table view of available positions.",
    },
  ];

  if (isCandidate(user)) {
    items.push(
      {
        key: "my-profile",
        label: "My Profile",
        title: "My Profile",
        description: "Candidate personal profile with attributes and projects.",
      },
      {
        key: "my-cvs",
        label: "My CVs",
        title: "My CVs",
        description: "Table view of CVs created by the candidate.",
      },
    );
  }

  if (isRecruiter(user)) {
    items.push(
      {
        key: "attribute-library",
        label: "Attribute Library",
        title: "Attribute Library",
        description: "Reusable attributes managed by recruiters.",
      },
      {
        key: "cv-search",
        label: "CV Search",
        title: "CV Search",
        description: "Search and browse published candidate CVs.",
      },
    );
  }

  if (isAdmin(user)) {
    items.push(
      {
        key: "admin-users",
        label: "Admin Users",
        title: "Admin Users",
        description: "Manage users, statuses, and roles.",
      },
      {
        key: "admin-profiles",
        label: "All Profiles",
        title: "All Profiles",
        description: "Admin access to candidate profiles.",
      },
    );
  }

  return items;
}

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedPageKey, setSelectedPageKey] = useState("dashboard");

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const menuItems = getMenuItems(user);
  const selectedPage =
    menuItems.find((item) => item.key === selectedPageKey) || menuItems[0];

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
            selectedKeys={[selectedPage.key]}
            onClick={({ key }) => setSelectedPageKey(key)}
            items={menuItems.map((item) => ({
              key: item.key,
              label: item.label,
            }))}
            style={{ height: "100%", borderRight: 0 }}
          />
        </Sider>

        <Content style={{ padding: 24 }}>
          {selectedPage.key === "attribute-library" ? (
            <AttributeLibraryPage />
          ) : (
            <PagePlaceholder
              title={selectedPage.title}
              description={selectedPage.description}
            />
          )}
        </Content>
      </Layout>
    </Layout>
  );
}
