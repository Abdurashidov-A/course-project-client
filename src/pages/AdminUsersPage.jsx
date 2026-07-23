import {
  Alert,
  Button,
  Empty,
  Grid,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../api/adminUserApi";
import { isAdmin } from "../utils/roles";
import { useI18n } from "../i18n/i18nContext";

const { Title, Text } = Typography;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function AdminUsersPage({ user }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const queryClient = useQueryClient();
  const canAccess = isAdmin(user);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [roleFilter, setRoleFilter] = useState();
  const [statusFilter, setStatusFilter] = useState();
  const [search, setSearch] = useState("");
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [nextRole, setNextRole] = useState();

  const {
    data,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["admin-users", searchValue, roleFilter, statusFilter, page, pageSize],
    queryFn: () =>
      getAdminUsers({
        q: searchValue || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        page,
        pageSize,
      }),
    enabled: canAccess,
  });

  const users = data?.items || [];
  const selectedUser = users.find((item) => item.id === selectedRowKeys[0]) || null;

  const roleMutation = useMutation({
    mutationFn: ({ userId, payload }) => updateAdminUserRole(userId, payload),
    onSuccess: () => {
      message.success(t("adminUsers.roleUpdated", "User role updated"));
      setIsRoleModalOpen(false);
      setNextRole(undefined);
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        message.warning(
          t(
            "adminUsers.conflict",
            "User was changed elsewhere. Please reload and try again.",
          ),
        );
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        return;
      }

      message.error(
        error.response?.data?.message ||
          t("adminUsers.roleUpdateFailed", "Failed to update user role"),
      );
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ userId, payload }) => updateAdminUserStatus(userId, payload),
    onSuccess: () => {
      message.success(t("adminUsers.statusUpdated", "User status updated"));
      setSelectedRowKeys([]);
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        message.warning(
          t(
            "adminUsers.conflict",
            "User was changed elsewhere. Please reload and try again.",
          ),
        );
        queryClient.invalidateQueries({ queryKey: ["admin-users"] });
        return;
      }

      message.error(
        error.response?.data?.message ||
          t("adminUsers.statusUpdateFailed", "Failed to update user status"),
      );
    },
  });

  const canChangeSelectedRole =
    selectedRowKeys.length === 1 &&
    selectedUser &&
    !(selectedUser.id === user.id && selectedUser.role === "ADMIN");

  const canChangeSelectedStatus =
    selectedRowKeys.length === 1 &&
    selectedUser &&
    selectedUser.id !== user.id;

  const columns = useMemo(
    () => [
      {
        title: t("adminUsers.name", "Name"),
        dataIndex: "name",
        key: "name",
      },
      {
        title: t("adminUsers.email", "Email"),
        dataIndex: "email",
        key: "email",
      },
      {
        title: t("adminUsers.role", "Role"),
        dataIndex: "role",
        key: "role",
        render: (role) => <Tag>{t(`roles.${role?.toLowerCase()}`, role)}</Tag>,
      },
      {
        title: t("adminUsers.status", "Status"),
        dataIndex: "status",
        key: "status",
        render: (status) => (
          <Tag color={status === "ACTIVE" ? "green" : "red"}>
            {status === "ACTIVE"
              ? t("adminUsers.active", "Active")
              : t("adminUsers.blocked", "Blocked")}
          </Tag>
        ),
      },
      {
        title: t("adminUsers.createdAt", "Created At"),
        dataIndex: "createdAt",
        key: "createdAt",
        render: formatDate,
      },
      {
        title: t("adminUsers.version", "Version"),
        dataIndex: "version",
        key: "version",
        width: 100,
      },
    ],
    [t],
  );

  if (!canAccess) {
    return <Alert type="error" message={t("adminUsers.accessDenied", "Access denied")} />;
  }

  if (isError) {
    return <Alert type="error" message={t("adminUsers.loadError", "Failed to load users")} />;
  }

  return (
    <div className="responsive-page">
      <Space direction="vertical" size="middle" style={{ width: "100%" }}>
        <div className="responsive-page__title-group">
          <Title level={2} className="responsive-page__title" style={{ marginBottom: 8 }}>
            {t("adminUsers.title", "Admin Users")}
          </Title>
          <Text className="responsive-page__subtitle" type="secondary">
            {t("nav.adminUsers", "Users")}
          </Text>
        </div>

        <Space className="responsive-filter-bar" wrap>
          <Input.Search
            className="responsive-filter-control"
            placeholder={t("adminUsers.search", "Search users")}
            allowClear
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            onSearch={(value) => {
              setPage(1);
              setSearchValue(value.trim());
            }}
            style={{ width: 260 }}
          />
          <Select
            className="responsive-filter-control"
            allowClear
            value={roleFilter}
            onChange={(value) => {
              setPage(1);
              setRoleFilter(value);
            }}
            placeholder={t("adminUsers.role", "Role")}
            style={{ width: 180 }}
            options={[
              { label: t("roles.candidate", "Candidate"), value: "CANDIDATE" },
              { label: t("roles.recruiter", "Recruiter"), value: "RECRUITER" },
              { label: t("roles.admin", "Admin"), value: "ADMIN" },
            ]}
          />
          <Select
            className="responsive-filter-control"
            allowClear
            value={statusFilter}
            onChange={(value) => {
              setPage(1);
              setStatusFilter(value);
            }}
            placeholder={t("adminUsers.status", "Status")}
            style={{ width: 180 }}
            options={[
              { label: t("adminUsers.active", "Active"), value: "ACTIVE" },
              { label: t("adminUsers.blocked", "Blocked"), value: "BLOCKED" },
            ]}
          />
        </Space>

        <div className="responsive-toolbar responsive-toolbar--actions">
          <Text className="responsive-toolbar__meta" type="secondary">
            {t("common.selected", "Selected")}: {selectedRowKeys.length}
          </Text>
          {selectedRowKeys.length !== 1 ? (
            <Text className="responsive-toolbar__note" type="warning">
              {t("adminUsers.selectOneUser", "Select one user")}
            </Text>
          ) : null}
          <Button
            disabled={!canChangeSelectedRole}
            onClick={() => {
              if (selectedUser?.id === user.id) {
                message.warning(
                  t(
                    "adminUsers.cannotChangeOwnAdminRole",
                    "You cannot change your own admin role",
                  ),
                );
                return;
              }

              setNextRole(selectedUser?.role);
              setIsRoleModalOpen(true);
            }}
          >
            {t("adminUsers.changeRole", "Change Role")}
          </Button>
          <Button
            disabled={!canChangeSelectedStatus}
            loading={statusMutation.isPending}
            onClick={() => {
              if (!selectedUser) {
                return;
              }

              statusMutation.mutate({
                userId: selectedUser.id,
                payload: {
                  status: selectedUser.status === "ACTIVE" ? "BLOCKED" : "ACTIVE",
                  version: selectedUser.version,
                },
              });
            }}
          >
            {selectedUser?.status === "ACTIVE"
              ? t("adminUsers.block", "Block")
              : t("adminUsers.activate", "Activate")}
          </Button>
        </div>

        <Table
          className="responsive-table"
          rowKey="id"
          loading={isLoading}
          columns={columns}
          dataSource={users}
          scroll={!screens.lg ? { x: 940 } : undefined}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          pagination={{
            current: page,
            pageSize,
            total: data?.total || 0,
            showSizeChanger: false,
            onChange: (nextPage) => {
              setPage(nextPage);
              setSelectedRowKeys([]);
            },
          }}
          locale={{
            emptyText: <Empty description={t("adminUsers.noUsers", "No users found")} />,
          }}
        />

        <Modal
          className="responsive-modal"
          title={t("adminUsers.changeRole", "Change Role")}
          open={isRoleModalOpen}
          onCancel={() => {
            setIsRoleModalOpen(false);
            setNextRole(undefined);
          }}
          onOk={() => {
            if (!selectedUser || !nextRole) {
              return;
            }

            roleMutation.mutate({
              userId: selectedUser.id,
              payload: {
                role: nextRole,
                version: selectedUser.version,
              },
            });
          }}
          confirmLoading={roleMutation.isPending}
          width={screens.sm ? 480 : "calc(100vw - 24px)"}
        >
          <Space direction="vertical" style={{ width: "100%" }}>
            {selectedUser?.id === user.id ? (
              <Alert
                type="warning"
                message={t(
                  "adminUsers.cannotChangeOwnAdminRole",
                  "You cannot change your own admin role",
                )}
              />
            ) : null}
            <Select
              value={nextRole}
              onChange={setNextRole}
              options={[
                { label: t("roles.candidate", "Candidate"), value: "CANDIDATE" },
                { label: t("roles.recruiter", "Recruiter"), value: "RECRUITER" },
                { label: t("roles.admin", "Admin"), value: "ADMIN" },
              ]}
            />
          </Space>
        </Modal>
      </Space>
    </div>
  );
}
