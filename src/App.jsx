import {
  Button,
  ConfigProvider,
  Layout,
  Menu,
  Segmented,
  Space,
  Switch,
  Typography,
  theme,
} from "antd";
import { useState } from "react";
import LoginPage from "./pages/LoginPage";
import { useAuth } from "./context/AuthContext";
import {
  canManageLibrary,
  canManageUsers,
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
import { AdminUsersPage } from "./pages/AdminUsersPage";
import { GlobalSearch } from "./components/GlobalSearch";
import { useThemeMode } from "./hooks/useThemeMode";
import { useI18n } from "./i18n/I18nProvider";
import { OAuthCallbackPage } from "./pages/OAuthCallbackPage";
import { PublicDashboardPage } from "./pages/PublicDashboardPage";
import { PublicPositionsPage } from "./pages/PublicPositionsPage";

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

function getMenuItems(user, t) {
  if (!user) {
    return [
      {
        key: "dashboard",
        label: t("guest.publicDashboard", "Public Dashboard"),
        title: t("guest.publicDashboard", "Public Dashboard"),
        description: "Public overview page for guest visitors.",
      },
      {
        key: "positions",
        label: t("guest.publicPositions", "Public Positions"),
        title: t("guest.publicPositions", "Public Positions"),
        description: "Public table view of positions.",
      },
      {
        key: "login",
        label: t("header.login", "Login"),
        title: t("header.login", "Login"),
        description: "Login page for demo or OAuth access.",
      },
    ];
  }

  const items = [
    {
      key: "dashboard",
      label: t("nav.dashboard", "Dashboard"),
      title: t("nav.dashboard", "Dashboard"),
      description: "Main overview page with statistics and latest positions.",
    },
    {
      key: "positions",
      label: t("nav.positions", "Positions"),
      title: t("nav.positions", "Positions"),
      description: "Table view of available positions.",
    },
  ];

  if (isCandidate(user)) {
    items.push(
      {
        key: "my-profile",
        label: t("nav.myProfile", "My Profile"),
        title: t("nav.myProfile", "My Profile"),
        description: "Candidate personal profile with attributes and projects.",
      },
      {
        key: "my-cvs",
        label: t("nav.myCvs", "My CVs"),
        title: t("nav.myCvs", "My CVs"),
        description: "Table view of CVs created by the candidate.",
      },
      {
        key: "my-projects",
        label: t("nav.myProjects", "My Projects"),
        title: t("nav.myProjects", "My Projects"),
        description: "Table view of projects created by the candidate.",
      },
    );
  }

  if (canManageLibrary(user)) {
    items.push(
      {
        key: "attribute-library",
        label: t("nav.attributeLibrary", "Attribute Library"),
        title: t("nav.attributeLibrary", "Attribute Library"),
        description: "Reusable attributes managed by recruiters.",
      },
    );
  }

  if (canManageUsers(user)) {
    items.push({
      key: "admin-users",
      label: t("nav.adminUsers", "Users"),
      title: t("adminUsers.title", "Admin Users"),
      description: "Admin-only user management table.",
    });
  }

  return items;
}

export default function App() {
  const { user, isAuthenticated, logout } = useAuth();
  const { themeMode, isDarkMode, setThemeMode } = useThemeMode();
  const { language, setLanguage, t } = useI18n();
  const [selectedPageKey, setSelectedPageKey] = useState("dashboard");
  const [selectedCvId, setSelectedCvId] = useState(null);
  const [selectedPositionId, setSelectedPositionId] = useState(null);
  const [cvPreviewSource, setCvPreviewSource] = useState("my-cvs");
  const isOAuthCallbackPath = window.location.pathname === "/oauth/callback";
  const menuItems = getMenuItems(user, t);
  const isGuest = !isAuthenticated;
  const effectiveSelectedPageKey =
    !isGuest && selectedPageKey === "login" ? "dashboard" : selectedPageKey;
  const isLoginPage = isGuest && effectiveSelectedPageKey === "login";
  const menuSelectedKey =
    effectiveSelectedPageKey === "cv-preview"
      ? cvPreviewSource === "position-cvs"
        ? "positions"
        : "my-cvs"
      : effectiveSelectedPageKey === "position-cvs"
        ? "positions"
        : effectiveSelectedPageKey;
  const selectedPage =
    menuItems.find((item) => item.key === menuSelectedKey) || menuItems[0];
  const themeTokens = {
    colorPrimary: isDarkMode ? "#818cf8" : "#4f46e5",
    borderRadius: 12,
    colorBgLayout: isDarkMode ? "#0f172a" : "#f6f7fb",
    colorBgContainer: isDarkMode ? "#111827" : "#ffffff",
    colorText: isDarkMode ? "#f8fafc" : "#172033",
    colorTextSecondary: isDarkMode ? "#94a3b8" : "#667085",
    colorBorderSecondary: isDarkMode ? "#293449" : "#e6e8ef",
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: isDarkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: themeTokens,
      }}
    >
      <div className={`app-shell app-theme-${themeMode}`}>
        {isOAuthCallbackPath ? (
          <OAuthCallbackPage />
        ) : (
          <Layout style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
            <Header className="app-header">
              <div className="app-brand">{t("app.title", "CV Management System")}</div>

              <Space wrap>
                <GlobalSearch />
                <Space size="small">
                  <Text className="app-header-text">{t("header.theme", "Theme")}</Text>
                  <Switch
                    checked={isDarkMode}
                    checkedChildren={t("theme.dark", "Dark")}
                    unCheckedChildren={t("theme.light", "Light")}
                    onChange={(checked) =>
                      setThemeMode(checked ? "dark" : "light")
                    }
                  />
                </Space>
                <Space size="small">
                  <Text className="app-header-text">
                    {t("header.language", "Language")}
                  </Text>
                  <Segmented
                    size="small"
                    value={language}
                    onChange={setLanguage}
                    options={[
                      { label: "EN", value: "en" },
                      { label: "UZ", value: "uz" },
                    ]}
                  />
                </Space>
                <Text className="app-header-text">
                  {isGuest ? t("guest.guest", "Guest") : user.name}
                </Text>
                {isGuest ? (
                  <Button onClick={() => setSelectedPageKey("login")}>
                    {t("header.login", "Login")}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      logout();
                      setSelectedPageKey("dashboard");
                      setSelectedCvId(null);
                      setSelectedPositionId(null);
                      setCvPreviewSource("my-cvs");
                    }}
                  >
                    {t("header.logout", "Logout")}
                  </Button>
                )}
              </Space>
            </Header>

            <Layout style={{ background: "var(--app-bg)" }}>
              {!isLoginPage ? (
                <Sider width={240} theme={isDarkMode ? "dark" : "light"}>
                  <Menu
                    mode="inline"
                    theme={isDarkMode ? "dark" : "light"}
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
              ) : null}

              <Content
                className={`app-content${isLoginPage ? " app-content--login" : ""}`}
              >
                {isGuest ? (
                  effectiveSelectedPageKey === "positions" ? (
                    <PublicPositionsPage
                      onOpenLogin={() => setSelectedPageKey("login")}
                    />
                  ) : effectiveSelectedPageKey === "login" ? (
                    <LoginPage embedded />
                  ) : (
                    <PublicDashboardPage />
                  )
                ) : effectiveSelectedPageKey === "dashboard" ? (
                  <DashboardPage />
                ) : effectiveSelectedPageKey === "attribute-library" ? (
                  <AttributeLibraryPage user={user} />
                ) : effectiveSelectedPageKey === "positions" ? (
                  <PositionsPage
                    user={user}
                    onViewPublishedCvs={(positionId) => {
                      setSelectedPositionId(positionId);
                      setSelectedPageKey("position-cvs");
                    }}
                  />
                ) : effectiveSelectedPageKey === "my-profile" ? (
                  <CandidateProfilePage user={user} />
                ) : effectiveSelectedPageKey === "my-cvs" ? (
                  <MyCvsPage
                    user={user}
                    onOpenCv={(cvId) => {
                      setSelectedCvId(cvId);
                      setCvPreviewSource("my-cvs");
                      setSelectedPageKey("cv-preview");
                    }}
                  />
                ) : effectiveSelectedPageKey === "my-projects" ? (
                  <MyProjectsPage user={user} />
                ) : effectiveSelectedPageKey === "position-cvs" ? (
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
                ) : effectiveSelectedPageKey === "admin-users" ? (
                  <AdminUsersPage user={user} />
                ) : effectiveSelectedPageKey === "cv-preview" ? (
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
        )}
      </div>
    </ConfigProvider>
  );
}
