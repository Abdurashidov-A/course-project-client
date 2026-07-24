import {
  Button,
  ConfigProvider,
  Drawer,
  Grid,
  Layout,
  Menu,
  Segmented,
  Spin,
  Switch,
  Typography,
  theme,
} from "antd";
import { MenuOutlined } from "@ant-design/icons";
import { lazy, Suspense, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "./context/authContext";
import {
  canManageLibrary,
  canManageUsers,
  canViewPublishedCvs,
  isAdmin,
  isCandidate,
  isRecruiter,
} from "./utils/roles";
import PagePlaceholder from "./components/PagePlaceholder";
import { GlobalSearch } from "./components/GlobalSearch";
import { useThemeMode } from "./hooks/useThemeMode";
import { useI18n } from "./i18n/i18nContext";

function lazyNamedPage(importPage, exportName) {
  return lazy(() =>
    importPage().then((pageModule) => ({ default: pageModule[exportName] })),
  );
}

const LoginPage = lazy(() => import("./pages/LoginPage"));
const AttributeLibraryPage = lazyNamedPage(
  () => import("./pages/AttributeLibraryPage"),
  "AttributeLibraryPage",
);
const DashboardPage = lazyNamedPage(
  () => import("./pages/DashboardPage"),
  "DashboardPage",
);
const PositionsPage = lazyNamedPage(
  () => import("./pages/PositionsPage"),
  "PositionsPage",
);
const CandidateProfilePage = lazyNamedPage(
  () => import("./pages/CandidateProfilePage"),
  "CandidateProfilePage",
);
const MyCvsPage = lazyNamedPage(
  () => import("./pages/MyCvsPage"),
  "MyCvsPage",
);
const MyProjectsPage = lazyNamedPage(
  () => import("./pages/MyProjectsPage"),
  "MyProjectsPage",
);
const CvPreviewPage = lazyNamedPage(
  () => import("./pages/CvPreviewPage"),
  "CvPreviewPage",
);
const PositionCvsPage = lazyNamedPage(
  () => import("./pages/PositionCvsPage"),
  "PositionCvsPage",
);
const AdminUsersPage = lazyNamedPage(
  () => import("./pages/AdminUsersPage"),
  "AdminUsersPage",
);
const OAuthCallbackPage = lazyNamedPage(
  () => import("./pages/OAuthCallbackPage"),
  "OAuthCallbackPage",
);
const PublicDashboardPage = lazyNamedPage(
  () => import("./pages/PublicDashboardPage"),
  "PublicDashboardPage",
);
const PublicPositionsPage = lazyNamedPage(
  () => import("./pages/PublicPositionsPage"),
  "PublicPositionsPage",
);

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const PAGE_PATHS = {
  "admin-users": "/admin/users",
  "attribute-library": "/attribute-library",
  dashboard: "/dashboard",
  login: "/login",
  "my-cvs": "/my-cvs",
  "my-profile": "/my-profile",
  "my-projects": "/my-projects",
  positions: "/positions",
};

function decodePathSegment(segment) {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function getRouteState(pathname, search) {
  if (pathname === "/oauth/callback") {
    return { pageKey: "oauth-callback" };
  }

  const positionCvsMatch = pathname.match(
    /^\/positions\/([^/]+)\/cvs\/?$/,
  );

  if (positionCvsMatch) {
    return {
      pageKey: "position-cvs",
      positionId: decodePathSegment(positionCvsMatch[1]),
    };
  }

  const cvPreviewMatch = pathname.match(/^\/cvs\/([^/]+)\/?$/);

  if (cvPreviewMatch) {
    const searchParams = new URLSearchParams(search);
    const previewSource =
      searchParams.get("from") === "position-cvs"
        ? "position-cvs"
        : "my-cvs";

    return {
      pageKey: "cv-preview",
      cvId: decodePathSegment(cvPreviewMatch[1]),
      cvPreviewSource: previewSource,
      positionId:
        previewSource === "position-cvs"
          ? searchParams.get("positionId")
          : null,
    };
  }

  if (pathname === "/" || pathname === "/dashboard") {
    return { pageKey: "dashboard" };
  }

  return {
    pageKey:
      Object.entries(PAGE_PATHS).find(([, path]) => path === pathname)?.[0] ||
      "dashboard",
    isUnknown: !Object.values(PAGE_PATHS).includes(pathname),
  };
}

function getPagePath(pageKey, isGuest) {
  if (pageKey === "dashboard" && isGuest) {
    return "/";
  }

  return PAGE_PATHS[pageKey] || "/";
}

function getPositionCvsPath(positionId) {
  return `/positions/${encodeURIComponent(positionId)}/cvs`;
}

function getCvPreviewPath(cvId, source, positionId = null) {
  const searchParams = new URLSearchParams({
    from: source === "position-cvs" ? "position-cvs" : "my-cvs",
  });

  if (source === "position-cvs" && positionId) {
    searchParams.set("positionId", positionId);
  }

  return `/cvs/${encodeURIComponent(cvId)}?${searchParams.toString()}`;
}

function getRouteRedirect(routeState, user, isAuthenticated) {
  if (routeState.pageKey === "oauth-callback") {
    return null;
  }

  if (routeState.isUnknown) {
    return isAuthenticated ? PAGE_PATHS.dashboard : "/";
  }

  if (!isAuthenticated) {
    return ["dashboard", "positions", "login"].includes(routeState.pageKey)
      ? null
      : PAGE_PATHS.login;
  }

  if (routeState.pageKey === "login") {
    return PAGE_PATHS.dashboard;
  }

  if (
    ["my-profile", "my-cvs", "my-projects"].includes(routeState.pageKey) &&
    !isCandidate(user)
  ) {
    return PAGE_PATHS.dashboard;
  }

  if (
    routeState.pageKey === "attribute-library" &&
    !canManageLibrary(user)
  ) {
    return PAGE_PATHS.dashboard;
  }

  if (routeState.pageKey === "admin-users" && !canManageUsers(user)) {
    return PAGE_PATHS.dashboard;
  }

  if (
    routeState.pageKey === "position-cvs" &&
    !canViewPublishedCvs(user)
  ) {
    return PAGE_PATHS.positions;
  }

  if (
    routeState.pageKey === "cv-preview" &&
    !isCandidate(user) &&
    !isRecruiter(user) &&
    !isAdmin(user)
  ) {
    return PAGE_PATHS.dashboard;
  }

  return null;
}

function PageLoading({ fullPage = false }) {
  return (
    <div
      className={`app-page-loading${fullPage ? " app-page-loading--full" : ""}`}
    >
      <Spin size="large" />
    </div>
  );
}

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
  const location = useLocation();
  const navigate = useNavigate();
  const screens = Grid.useBreakpoint();
  const isMobileNav = !screens.lg && !!screens.xs;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const routeState = getRouteState(location.pathname, location.search);
  const selectedPageKey = routeState.pageKey;
  const selectedCvId = routeState.cvId;
  const selectedPositionId = routeState.positionId;
  const isOAuthCallbackPath = location.pathname === "/oauth/callback";
  const menuItems = getMenuItems(user, t);
  const isGuest = !isAuthenticated;
  const routeRedirectPath = getRouteRedirect(
    routeState,
    user,
    isAuthenticated,
  );
  const cvPreviewSource =
    routeState.cvPreviewSource === "position-cvs" &&
    canViewPublishedCvs(user)
      ? "position-cvs"
      : isCandidate(user)
        ? "my-cvs"
        : "positions";
  const effectiveSelectedPageKey = selectedPageKey;
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

  useEffect(() => {
    if (routeRedirectPath) {
      navigate(routeRedirectPath, { replace: true });
    }
  }, [navigate, routeRedirectPath]);

  function handleMenuNavigation(key) {
    navigate(getPagePath(key, isGuest));
    setIsMobileMenuOpen(false);
  }

  const navigationMenuItems = menuItems.map((item) => ({
    key: item.key,
    label: item.label,
  }));
  const navigationMenuProps = {
    mode: "inline",
    theme: isDarkMode ? "dark" : "light",
    selectedKeys: [menuSelectedKey],
    onClick: ({ key }) => handleMenuNavigation(key),
    items: navigationMenuItems,
  };
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
        {routeRedirectPath ? (
          <PageLoading fullPage />
        ) : isOAuthCallbackPath ? (
          <Suspense fallback={<PageLoading fullPage />}>
            <OAuthCallbackPage />
          </Suspense>
        ) : (
          <Layout style={{ minHeight: "100vh", background: "var(--app-bg)" }}>
            <Header className="app-header">
              <div className="app-header__brand-row">
                {isMobileNav && !isLoginPage ? (
                  <Button
                    type="text"
                    icon={<MenuOutlined />}
                    className="app-mobile-menu-button"
                    aria-label={t("common.menu", "Menu")}
                    onClick={() => setIsMobileMenuOpen(true)}
                  />
                ) : null}
                <div className="app-brand">{t("app.title", "CV Management System")}</div>
              </div>

              {!isLoginPage ? (
                <div className="app-header__search">
                  <GlobalSearch />
                </div>
              ) : null}

              <div className="app-header__controls">
                <div className="app-header__control-group">
                  <Text className="app-header-text">{t("header.theme", "Theme")}</Text>
                  <Switch
                    checked={isDarkMode}
                    checkedChildren={t("theme.dark", "Dark")}
                    unCheckedChildren={t("theme.light", "Light")}
                    onChange={(checked) =>
                      setThemeMode(checked ? "dark" : "light")
                    }
                  />
                </div>
                <div className="app-header__control-group">
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
                </div>
                <Text className="app-header-text app-header__user">
                  {isGuest ? t("guest.guest", "Guest") : user.name}
                </Text>
                {isGuest ? (
                  <Button onClick={() => handleMenuNavigation("login")}>
                    {t("header.login", "Login")}
                  </Button>
                ) : (
                  <Button
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                      navigate("/", { replace: true });
                    }}
                  >
                    {t("header.logout", "Logout")}
                  </Button>
                )}
              </div>
            </Header>

            <Layout style={{ background: "var(--app-bg)" }}>
              {!isLoginPage && !isMobileNav ? (
                <Sider width={240} theme={isDarkMode ? "dark" : "light"}>
                  <Menu
                    {...navigationMenuProps}
                    style={{ height: "100%", borderRight: 0 }}
                  />
                </Sider>
              ) : null}

              {isMobileNav && !isLoginPage ? (
                <Drawer
                  placement="left"
                  open={isMobileMenuOpen}
                  onClose={() => setIsMobileMenuOpen(false)}
                  width={272}
                  className="app-mobile-drawer"
                  title={null}
                  styles={{
                    header: { display: "none" },
                    body: { padding: 0 },
                  }}
                >
                  <Menu
                    {...navigationMenuProps}
                    className="app-mobile-drawer__menu"
                    style={{ borderRight: 0 }}
                  />
                </Drawer>
              ) : null}

              <Content
                className={`app-content${isLoginPage ? " app-content--login" : ""}`}
              >
                <Suspense fallback={<PageLoading />}>
                  {isGuest ? (
                    effectiveSelectedPageKey === "positions" ? (
                      <PublicPositionsPage
                        onOpenLogin={() => navigate(PAGE_PATHS.login)}
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
                        navigate(getPositionCvsPath(positionId));
                      }}
                    />
                  ) : effectiveSelectedPageKey === "my-profile" ? (
                    <CandidateProfilePage user={user} />
                  ) : effectiveSelectedPageKey === "my-cvs" ? (
                    <MyCvsPage
                      user={user}
                      onOpenCv={(cvId) => {
                        navigate(getCvPreviewPath(cvId, "my-cvs"));
                      }}
                    />
                  ) : effectiveSelectedPageKey === "my-projects" ? (
                    <MyProjectsPage user={user} />
                  ) : effectiveSelectedPageKey === "position-cvs" ? (
                    <PositionCvsPage
                      user={user}
                      positionId={selectedPositionId}
                      onBack={() => {
                        navigate(PAGE_PATHS.positions);
                      }}
                      onOpenCv={(cvId) => {
                        navigate(
                          getCvPreviewPath(
                            cvId,
                            "position-cvs",
                            selectedPositionId,
                          ),
                        );
                      }}
                    />
                  ) : effectiveSelectedPageKey === "admin-users" ? (
                    <AdminUsersPage user={user} />
                  ) : effectiveSelectedPageKey === "cv-preview" ? (
                    <CvPreviewPage
                      cvId={selectedCvId}
                      onBack={() => {
                        if (
                          cvPreviewSource === "position-cvs" &&
                          selectedPositionId
                        ) {
                          navigate(getPositionCvsPath(selectedPositionId));
                          return;
                        }

                        navigate(
                          isCandidate(user)
                            ? PAGE_PATHS["my-cvs"]
                            : PAGE_PATHS.positions,
                        );
                      }}
                    />
                  ) : (
                    <PagePlaceholder
                      title={selectedPage.title}
                      description={selectedPage.description}
                    />
                  )}
                </Suspense>
              </Content>
            </Layout>
          </Layout>
        )}
      </div>
    </ConfigProvider>
  );
}
