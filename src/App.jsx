import { Button, Layout, Menu, Space, Typography } from "antd";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import {
  canManageLibrary,
  canViewPublishedCvs,
  isCandidate,
} from "./utils/roles";
import PagePlaceholder from "./components/PagePlaceholder";
import { AttributeLibraryPage } from "./pages/AttributeLibraryPage";
import { DashboardPage } from "./pages/DashboardPage";
import { PositionsPage } from "./pages/PositionsPage";
import { CandidateProfilePage } from "./pages/CandidateProfilePage";
import { MyCvsPage } from "./pages/MyCvsPage";
import { MyProjectsPage } from "./pages/MyProjectsPage";
import { CvPreviewPage } from "./pages/CvPreviewPage";
import { PositionCvsPage } from "./pages/PositionCvsPage";

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
      {
        key: "my-projects",
        label: "My Projects",
        title: "My Projects",
        description: "Table view of projects created by the candidate.",
      },
    );
  }

  if (canManageLibrary(user)) {
    items.push(
      {
        key: "attribute-library",
        label: "Attribute Library",
        title: "Attribute Library",
        description: "Reusable attributes managed by recruiters.",
      },
    );
  }

  return items;
}

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedPageKey, setSelectedPageKey] = useState("dashboard");
  const [selectedCvId, setSelectedCvId] = useState(null);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [cvPreviewSource, setCvPreviewSource] = useState("my-cvs");

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  const menuItems = getMenuItems(user);
  const menuSelectedKey =
    selectedPageKey === "cv-preview"
      ? cvPreviewSource === "position-cvs"
        ? "positions"
        : "my-cvs"
      : selectedPageKey === "position-cvs"
        ? "positions"
        : selectedPageKey;
  const selectedPage =
    menuItems.find((item) => item.key === menuSelectedKey) || menuItems[0];

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
            selectedKeys={[menuSelectedKey]}
            onClick={({ key }) => {
              setSelectedPageKey(key);

              if (key !== "cv-preview") {
                setSelectedCvId(null);
              }

              if (key !== "position-cvs" && key !== "cv-preview") {
                setSelectedPositionId(null);
              }
            }}
            items={menuItems.map((item) => ({
              key: item.key,
              label: item.label,
            }))}
            style={{ height: "100%", borderRight: 0 }}
          />
        </Sider>

        <Content style={{ padding: 24 }}>
          {selectedPageKey === "dashboard" ? (
            <DashboardPage />
          ) : selectedPageKey === "attribute-library" ? (
            <AttributeLibraryPage user={user} />
          ) : selectedPageKey === "positions" ? (
            <PositionsPage
              user={user}
              onViewPublishedCvs={(positionId) => {
                setSelectedPositionId(positionId);
                setSelectedPageKey("position-cvs");
              }}
            />
          ) : selectedPageKey === "my-profile" ? (
            <CandidateProfilePage user={user} />
          ) : selectedPageKey === "my-cvs" ? (
            <MyCvsPage
              user={user}
              onOpenCv={(cvId) => {
                setSelectedCvId(cvId);
                setCvPreviewSource("my-cvs");
                setSelectedPageKey("cv-preview");
              }}
            />
          ) : selectedPageKey === "my-projects" ? (
            <MyProjectsPage user={user} />
          ) : selectedPageKey === "position-cvs" ? (
            <PositionCvsPage
              user={user}
              positionId={selectedPositionId}
              onBack={() => {
                setSelectedPageKey("positions");
              }}
              onOpenCv={(cvId) => {
                setSelectedCvId(cvId);
                setCvPreviewSource("position-cvs");
                setSelectedPageKey("cv-preview");
              }}
            />
          ) : selectedPageKey === "cv-preview" ? (
            <CvPreviewPage
              cvId={selectedCvId}
              onBack={() => {
                setSelectedPageKey(cvPreviewSource);
              }}
            />
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
