import {
  Alert,
  Button,
  DatePicker,
  Empty,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import {
  createProject,
  deleteProjects,
  getMyProjects,
  updateProject,
} from "../api/projectApi";
import { isCandidate } from "../utils/roles";
import { useI18n } from "../i18n/I18nProvider";

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleDateString();
}

function getPeriodValue(project) {
  if (!project?.periodStart && !project?.periodEnd) {
    return undefined;
  }

  return [
    project.periodStart ? dayjs(project.periodStart) : null,
    project.periodEnd ? dayjs(project.periodEnd) : null,
  ];
}

function buildProjectPayload(values, version) {
  const payload = {
    name: values.name,
    description: values.description,
    periodStart: values.period?.[0] ? values.period[0].toISOString() : null,
    periodEnd: values.period?.[1] ? values.period[1].toISOString() : null,
    technologyTags: values.technologyTags || [],
  };

  if (typeof version === "number") {
    payload.version = version;
  }

  return payload;
}

export function MyProjectsPage({ user }) {
  const { t } = useI18n();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const queryClient = useQueryClient();

  if (!isCandidate(user)) {
    return <Alert type="warning" message={t("projects.noAccess", "You do not have access to this page")} />;
  }

  const {
    data: projects = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["my-projects"],
    queryFn: getMyProjects,
  });

  const selectedProject = projects.find(
    (project) => project.id === selectedProjectIds[0],
  );

  const technologyTagOptions = useMemo(() => {
    const tags = [...new Set(projects.flatMap((project) => project.technologyTags || []))];

    return tags.map((tag) => ({
      label: tag,
      value: tag,
    }));
  }, [projects]);

  const createProjectMutation = useMutation({
    mutationFn: createProject,
    onSuccess: () => {
      message.success(t("projects.createSuccess", "Project created successfully"));
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      form.resetFields();
      setIsCreateModalOpen(false);
    },
    onError: () => {
      message.error(t("projects.createError", "Failed to create project"));
    },
  });

  const updateProjectMutation = useMutation({
    mutationFn: ({ id, values }) => updateProject(id, values),
    onSuccess: () => {
      message.success(t("projects.updateSuccess", "Project updated successfully"));
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      editForm.resetFields();
      setSelectedProjectIds([]);
      setIsEditModalOpen(false);
    },
    onError: (error) => {
      if (error.response?.status === 409) {
        message.warning(
          t(
            "projects.conflict",
            "This project was changed elsewhere. Please reload and try again.",
          ),
        );
        return;
      }

      message.error(t("projects.updateError", "Failed to update project"));
    },
  });

  const deleteProjectsMutation = useMutation({
    mutationFn: deleteProjects,
    onSuccess: () => {
      message.success(t("projects.deleteSuccess", "Projects deleted successfully"));
      queryClient.invalidateQueries({ queryKey: ["my-projects"] });
      setSelectedProjectIds([]);
    },
    onError: () => {
      message.error(t("projects.deleteError", "Failed to delete projects"));
    },
  });

  const columns = [
    {
      title: t("projects.name", "Name"),
      dataIndex: "name",
      key: "name",
    },
    {
      title: t("projects.period", "Period"),
      key: "period",
      render: (_, record) =>
        `${formatDate(record.periodStart)} - ${formatDate(record.periodEnd)}`,
    },
    {
      title: t("projects.technologyTags", "Technology Tags"),
      dataIndex: "technologyTags",
      key: "technologyTags",
      render: (technologyTags) => {
        if (!technologyTags || technologyTags.length === 0) {
          return <Text type="secondary">{t("common.noTags", "No tags")}</Text>;
        }

        return (
          <Space wrap>
            {technologyTags.map((tag) => (
              <Tag key={tag}>{tag}</Tag>
            ))}
          </Space>
        );
      },
    },
    {
      title: t("projects.updatedAt", "Updated At"),
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: formatDate,
    },
    {
      title: t("projects.version", "Version"),
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  if (isError) {
    return <Alert type="error" message={t("projects.loadError", "Failed to load projects")} />;
  }

  return (
    <div>
      <Space
        style={{
          width: "100%",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <Title level={2} style={{ margin: 0 }}>
          {t("projects.title", "My Projects")}
        </Title>

        <Button type="primary" onClick={() => setIsCreateModalOpen(true)}>
          {t("projects.addProject", "Add Project")}
        </Button>
      </Space>

      <Space style={{ marginBottom: 16 }} wrap>
        <Text type="secondary">
          {t("common.selected", "Selected")}: {selectedProjectIds.length}
        </Text>

        <Button
          disabled={selectedProjectIds.length !== 1}
          onClick={() => {
            if (!selectedProject) return;

            editForm.setFieldsValue({
              name: selectedProject.name,
              description: selectedProject.description,
              period: getPeriodValue(selectedProject),
              technologyTags: selectedProject.technologyTags,
              version: selectedProject.version,
            });

            setIsEditModalOpen(true);
          }}
        >
          {t("projects.editSelected", "Edit Selected")}
        </Button>

        <Button
          danger
          disabled={selectedProjectIds.length === 0}
          loading={deleteProjectsMutation.isPending}
          onClick={() => {
            Modal.confirm({
              title: t("projects.deleteConfirmTitle", "Delete selected projects?"),
              content: t("projects.deleteConfirmBody", "This action will delete selected projects."),
              okText: t("common.delete", "Delete"),
              okButtonProps: { danger: true },
              onOk: () => deleteProjectsMutation.mutate(selectedProjectIds),
            });
          }}
        >
          {t("projects.deleteSelected", "Delete Selected")}
        </Button>
      </Space>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={projects}
        loading={isLoading}
        pagination={{ pageSize: 10 }}
        rowSelection={{
          selectedRowKeys: selectedProjectIds,
          onChange: setSelectedProjectIds,
        }}
        locale={{
          emptyText: <Empty description={t("projects.noProjects", "No projects created yet")} />,
        }}
      />

      <Modal
        title={t("projects.addProjectModal", "Add Project")}
        open={isCreateModalOpen}
        onCancel={() => setIsCreateModalOpen(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={(values) =>
            createProjectMutation.mutate(buildProjectPayload(values))
          }
        >
          <Form.Item
            label={t("projects.name", "Name")}
            name="name"
            rules={[{ required: true, message: t("projects.nameRequired", "Project name is required") }]}
          >
            <Input placeholder={t("projects.namePlaceholder", "Example: E-commerce Platform")} />
          </Form.Item>

          <Form.Item label={t("projects.period", "Period")} name="period">
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label={t("projects.description", "Description")} name="description">
            <TextArea
              rows={5}
              placeholder={t("projects.descriptionPlaceholder", "Write project description in Markdown text")}
            />
          </Form.Item>

          <Form.Item label={t("projects.technologyTags", "Technology Tags")} name="technologyTags">
            <Select
              mode="tags"
              options={technologyTagOptions}
              placeholder={t("projects.tagsPlaceholder", "Add technology tags")}
            />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={createProjectMutation.isPending}
          >
            {t("projects.saveProject", "Save Project")}
          </Button>
        </Form>
      </Modal>

      <Modal
        title={t("projects.editProjectModal", "Edit Project")}
        open={isEditModalOpen}
        onCancel={() => setIsEditModalOpen(false)}
        footer={null}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={(values) => {
            if (!selectedProject) return;

            updateProjectMutation.mutate({
              id: selectedProject.id,
              values: buildProjectPayload(values, values.version),
            });
          }}
        >
          <Form.Item
            label={t("projects.name", "Name")}
            name="name"
            rules={[{ required: true, message: t("projects.nameRequired", "Project name is required") }]}
          >
            <Input placeholder={t("projects.namePlaceholder", "Example: E-commerce Platform")} />
          </Form.Item>

          <Form.Item label={t("projects.period", "Period")} name="period">
            <RangePicker style={{ width: "100%" }} />
          </Form.Item>

          <Form.Item label={t("projects.description", "Description")} name="description">
            <TextArea
              rows={5}
              placeholder={t("projects.descriptionPlaceholder", "Write project description in Markdown text")}
            />
          </Form.Item>

          <Form.Item label={t("projects.technologyTags", "Technology Tags")} name="technologyTags">
            <Select
              mode="tags"
              options={technologyTagOptions}
              placeholder={t("projects.tagsPlaceholder", "Add technology tags")}
            />
          </Form.Item>

          <Form.Item name="version" hidden>
            <Input />
          </Form.Item>

          <Button
            type="primary"
            htmlType="submit"
            loading={updateProjectMutation.isPending}
          >
            {t("projects.saveChanges", "Save Changes")}
          </Button>
        </Form>
      </Modal>
    </div>
  );
}
