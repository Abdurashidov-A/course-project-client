import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Grid,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  message,
} from "antd";
import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import dayjs from "dayjs";
import { getAttributes } from "../api/attributeApi";
import {
  deleteProfileAttributes,
  getProfileAttributes,
  saveProfileAttribute,
} from "../api/profileAttributeApi";
import { isCandidate } from "../utils/roles";
import { useI18n } from "../i18n/i18nContext";
import { useDebouncedCallback } from "../hooks/useDebouncedCallback";

const { Title, Text } = Typography;
const { TextArea } = Input;
const { RangePicker } = DatePicker;
const AUTO_SAVE_DELAY_MS = 2000;

function getDisplayValue(record, t) {
  const type = record.attribute?.type;

  if (type === "STRING" || type === "SELECT") {
    return record.stringValue || t("common.none", "—");
  }

  if (type === "TEXT") {
    return record.textValue || t("common.none", "—");
  }

  if (type === "NUMERIC") {
    return record.numericValue ?? t("common.none", "—");
  }

  if (type === "BOOLEAN") {
    return record.booleanValue === null
      ? t("common.none", "—")
      : record.booleanValue
        ? t("common.yes", "Yes")
        : t("common.no", "No");
  }

  if (type === "DATE") {
    return record.dateValue
      ? new Date(record.dateValue).toLocaleDateString()
      : t("common.none", "—");
  }

  if (type === "PERIOD") {
    const start = record.periodStart
      ? new Date(record.periodStart).toLocaleDateString()
      : t("common.none", "—");

    const end = record.periodEnd
      ? new Date(record.periodEnd).toLocaleDateString()
      : t("common.none", "—");

    return `${start} - ${end}`;
  }

  if (type === "IMAGE") {
    return record.imageUrl || t("common.none", "—");
  }

  return t("common.none", "—");
}

function getFormValue(existingValue, attributeType) {
  if (!existingValue) {
    return attributeType === "BOOLEAN" ? false : undefined;
  }

  if (attributeType === "STRING" || attributeType === "SELECT") {
    return existingValue.stringValue || undefined;
  }

  if (attributeType === "TEXT") {
    return existingValue.textValue || undefined;
  }

  if (attributeType === "NUMERIC") {
    return existingValue.numericValue ?? undefined;
  }

  if (attributeType === "BOOLEAN") {
    return Boolean(existingValue.booleanValue);
  }

  if (attributeType === "DATE") {
    return existingValue.dateValue ? dayjs(existingValue.dateValue) : undefined;
  }

  if (attributeType === "PERIOD") {
    if (!existingValue.periodStart && !existingValue.periodEnd) {
      return undefined;
    }

    return [
      existingValue.periodStart ? dayjs(existingValue.periodStart) : null,
      existingValue.periodEnd ? dayjs(existingValue.periodEnd) : null,
    ];
  }

  if (attributeType === "IMAGE") {
    return existingValue.imageUrl || undefined;
  }

  return undefined;
}

function buildSavePayload(attribute, value, version) {
  const payload = {};

  if (typeof version === "number") {
    payload.version = version;
  }

  if (attribute.type === "PERIOD") {
    payload.value = {
      periodStart: value?.[0] ? value[0].toISOString() : null,
      periodEnd: value?.[1] ? value[1].toISOString() : null,
    };

    return payload;
  }

  if (attribute.type === "DATE") {
    payload.value = value ? value.toISOString() : null;

    return payload;
  }

  payload.value = value;

  return payload;
}

function renderValueInput(attribute, t) {
  if (!attribute) {
    return (
      <Input
        disabled
        placeholder={t("profile.attributePlaceholder", "Select attribute")}
      />
    );
  }

  if (attribute.type === "TEXT") {
    return <TextArea rows={4} placeholder={t("profile.value", "Value")} />;
  }

  if (attribute.type === "NUMERIC") {
    return (
      <InputNumber
        style={{ width: "100%" }}
        placeholder={t("attributeType.NUMERIC", "Numeric")}
      />
    );
  }

  if (attribute.type === "BOOLEAN") {
    return (
      <Switch
        checkedChildren={t("common.yes", "Yes")}
        unCheckedChildren={t("common.no", "No")}
      />
    );
  }

  if (attribute.type === "DATE") {
    return <DatePicker style={{ width: "100%" }} />;
  }

  if (attribute.type === "PERIOD") {
    return <RangePicker style={{ width: "100%" }} />;
  }

  if (attribute.type === "IMAGE") {
    return <Input placeholder="https://..." />;
  }

  if (attribute.type === "SELECT") {
    return (
      <Select
        style={{ width: "100%" }}
        placeholder={t("profile.value", "Value")}
        options={(attribute.options || []).map((option) => ({
          label: option.value,
          value: option.value,
        }))}
      />
    );
  }

  return <Input placeholder={t("profile.value", "Value")} />;
}

function serializeValue(attributeType, value) {
  if (attributeType === "DATE") {
    return value ? dayjs(value).toISOString() : null;
  }

  if (attributeType === "PERIOD") {
    return JSON.stringify([
      value?.[0] ? dayjs(value[0]).toISOString() : null,
      value?.[1] ? dayjs(value[1]).toISOString() : null,
    ]);
  }

  if (attributeType === "BOOLEAN") {
    return value === undefined ? "undefined" : String(value);
  }

  if (attributeType === "NUMERIC") {
    return value === undefined || value === null || value === "" ? "" : String(value);
  }

  return value ?? "";
}

function formatTime(value) {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function CandidateProfilePage({ user }) {
  const { t } = useI18n();
  const screens = Grid.useBreakpoint();
  const hasAccess = isCandidate(user);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAttributeId, setSelectedAttributeId] = useState(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [saveError, setSaveError] = useState("");
  const [isDirty, setIsDirty] = useState(false);

  const [form] = Form.useForm();
  const queryClient = useQueryClient();
  const saveRequestIdRef = useRef(0);
  const baselineRef = useRef("");
  const currentVersionRef = useRef(null);
  const autoSaveBlockedRef = useRef(false);
  const initializedRef = useRef(false);

  const {
    data: profileAttributes = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["profile-attributes"],
    queryFn: getProfileAttributes,
    enabled: hasAccess,
  });

  const { data: attributes = [] } = useQuery({
    queryKey: ["attributes"],
    queryFn: () => getAttributes(),
    enabled: hasAccess,
  });

  const selectedAttribute = useMemo(
    () =>
      attributes.find((attribute) => attribute.id === selectedAttributeId) || null,
    [attributes, selectedAttributeId],
  );

  function upsertProfileAttributeInCache(savedValue) {
    queryClient.setQueryData(["profile-attributes"], (current = []) => {
      const currentItems = Array.isArray(current) ? current : [];
      const existingIndex = currentItems.findIndex(
        (item) => item.attributeId === savedValue.attributeId,
      );

      if (existingIndex === -1) {
        return [savedValue, ...currentItems];
      }

      const nextItems = [...currentItems];
      nextItems[existingIndex] = savedValue;
      return nextItems;
    });
  }

  const saveMutation = useMutation({
    mutationFn: ({ attributeId, payload }) =>
      saveProfileAttribute(attributeId, payload),
    onSuccess: (savedValue, variables) => {
      if (variables.requestId < saveRequestIdRef.current) {
        return;
      }

      upsertProfileAttributeInCache(savedValue);
      const normalizedSavedValue = getFormValue(savedValue, selectedAttribute?.type);
      const nextSerialized = serializeValue(
        selectedAttribute?.type,
        normalizedSavedValue,
      );
      currentVersionRef.current = savedValue.version ?? null;
      baselineRef.current = nextSerialized;
      autoSaveBlockedRef.current = false;
      setIsDirty(false);
      setSaveStatus("saved");
      setLastSavedAt(new Date().toISOString());
      setSaveError("");
      form.setFieldValue("value", normalizedSavedValue);
    },
    onError: (error, variables) => {
      if (variables.requestId < saveRequestIdRef.current) {
        return;
      }

      autoSaveBlockedRef.current = true;

      if (error.response?.status === 409) {
        const conflictMessage = t(
          "profile.reopenAfterConflict",
          "This value was updated elsewhere. Please reopen the editor.",
        );
        setSaveError(conflictMessage);
        message.error(conflictMessage);
        queryClient.invalidateQueries({ queryKey: ["profile-attributes"] });
      } else {
        setSaveError(t("profile.saveError", "Failed to save profile attribute"));
        message.error(
          t("profile.saveError", "Failed to save profile attribute"),
        );
      }

      setSaveStatus("error");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteProfileAttributes,
    onSuccess: () => {
      message.success(
        t("profile.deleteSuccess", "Profile attribute value deleted"),
      );
      queryClient.invalidateQueries({ queryKey: ["profile-attributes"] });
      setSelectedRowKeys([]);
    },
    onError: () => {
      message.error(
        t(
          "profile.deleteError",
          "Failed to delete profile attribute value",
        ),
      );
    },
  });

  function resetAutoSaveState() {
    initializedRef.current = false;
    baselineRef.current = "";
    saveRequestIdRef.current = 0;
    currentVersionRef.current = null;
    autoSaveBlockedRef.current = false;
    setIsDirty(false);
    setSaveStatus("idle");
    setLastSavedAt(null);
    setSaveError("");
  }

  function applyAttributeSelection(attributeId) {
    cancelAutoSave();
    initializedRef.current = false;

    const nextAttribute =
      attributes.find((attribute) => attribute.id === attributeId) || null;
    const nextExistingValue = profileAttributes.find(
      (item) => item.attributeId === attributeId,
    );
    const nextFormValue = nextAttribute
      ? getFormValue(nextExistingValue, nextAttribute.type)
      : undefined;
    const nextSerialized = nextAttribute
      ? serializeValue(nextAttribute.type, nextFormValue)
      : "";

    setSelectedAttributeId(attributeId);
    form.setFieldsValue({
      attributeId,
      value: nextFormValue,
    });

    baselineRef.current = nextSerialized;
    currentVersionRef.current = nextExistingValue?.version ?? null;
    autoSaveBlockedRef.current = false;
    setIsDirty(false);
    setSaveStatus(nextExistingValue ? "saved" : "idle");
    setLastSavedAt(nextExistingValue?.updatedAt || null);
    setSaveError("");
    initializedRef.current = true;
  }

  function saveCurrentValue() {
    if (!isModalOpen || !selectedAttribute) {
      return;
    }

    if (saveMutation.isPending) {
      return;
    }

    const currentValue = form.getFieldValue("value");
    const currentSerialized = serializeValue(selectedAttribute.type, currentValue);

    if (currentSerialized === baselineRef.current) {
      setIsDirty(false);
      return;
    }

    const payload = buildSavePayload(
      selectedAttribute,
      currentValue,
      currentVersionRef.current,
    );
    const requestId = saveRequestIdRef.current + 1;
    saveRequestIdRef.current = requestId;
    setSaveStatus("saving");
    setSaveError("");

    saveMutation.mutate({
      attributeId: selectedAttribute.id,
      payload,
      requestId,
    });
  }

  const { schedule: scheduleAutoSave, cancel: cancelAutoSave } =
    useDebouncedCallback(saveCurrentValue, AUTO_SAVE_DELAY_MS);

  function handleFormValuesChange(changedValues, allValues) {
    if (
      !Object.hasOwn(changedValues, "value") ||
      !isModalOpen ||
      !selectedAttribute ||
      !initializedRef.current
    ) {
      return;
    }

    const currentSerialized = serializeValue(
      selectedAttribute.type,
      allValues.value,
    );
    const nextIsDirty = currentSerialized !== baselineRef.current;
    setIsDirty(nextIsDirty);

    if (saveStatus === "error") {
      autoSaveBlockedRef.current = false;
      setSaveError("");
    }

    if (!nextIsDirty) {
      if (saveStatus !== "saved") {
        setSaveStatus("idle");
      }
      cancelAutoSave();
      return;
    }

    if (saveMutation.isPending || autoSaveBlockedRef.current) {
      return;
    }

    setSaveStatus("unsaved");
    cancelAutoSave();
    scheduleAutoSave();
  }

  function openModal() {
    form.resetFields();
    resetAutoSaveState();
    setSelectedAttributeId(null);
    setIsModalOpen(true);
  }

  function closeModal() {
    cancelAutoSave();
    setIsModalOpen(false);
    form.resetFields();
    setSelectedAttributeId(null);
    resetAutoSaveState();
  }

  function handleSubmit() {
    if (saveMutation.isPending) {
      return;
    }

    const currentSerialized = selectedAttribute
      ? serializeValue(selectedAttribute.type, form.getFieldValue("value"))
      : "";

    if (saveStatus === "error" && !isDirty) {
      closeModal();
      return;
    }

    if (saveStatus === "saved" && currentSerialized === baselineRef.current) {
      closeModal();
      return;
    }

    cancelAutoSave();
    autoSaveBlockedRef.current = false;
    saveCurrentValue();
  }

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  };

  const columns = [
    {
      title: t("profile.attribute", "Attribute"),
      dataIndex: ["attribute", "name"],
      key: "attributeName",
    },
    {
      title: t("profile.category", "Category"),
      dataIndex: ["attribute", "category"],
      key: "category",
      render: (category) => t(`attributeCategory.${category}`, category),
    },
    {
      title: t("profile.type", "Type"),
      dataIndex: ["attribute", "type"],
      key: "type",
      render: (type) => t(`attributeType.${type}`, type),
    },
    {
      title: t("profile.value", "Value"),
      key: "value",
      render: (_, record) => <Text strong>{getDisplayValue(record, t)}</Text>,
    },
    {
      title: t("profile.version", "Version"),
      dataIndex: "version",
      key: "version",
      width: 100,
    },
  ];

  const statusTag =
    saveStatus === "unsaved" ? (
      <Tag color="orange">{t("profile.unsavedChanges", "Unsaved changes")}</Tag>
    ) : saveStatus === "saving" ? (
      <Tag color="processing">{t("profile.saving", "Saving...")}</Tag>
    ) : saveStatus === "saved" ? (
      <Tag color="green">{t("profile.saved", "Saved")}</Tag>
    ) : saveStatus === "error" ? (
      <Tag color="red">{t("profile.errorSaving", "Error saving")}</Tag>
    ) : null;

  const modalOkText = saveMutation.isPending
    ? t("profile.saving", "Saving...")
    : saveStatus === "saved" && !isDirty
      ? t("profile.saved", "Saved")
      : !isDirty
        ? t("common.close", "Close")
        : t("profile.saveNow", "Save now");

  if (!hasAccess) {
    return (
      <Alert
        type="warning"
        message={t("profile.noAccess", "You do not have access to this page")}
      />
    );
  }

  return (
    <Card className="responsive-page-card">
      <div className="responsive-page__header responsive-page__header--primary-action">
        <div className="responsive-page__title-group">
          <Title level={3} className="responsive-page__title" style={{ marginBottom: 4 }}>
            {t("profile.title", "My Profile Attributes")}
          </Title>

          <Text className="responsive-page__subtitle" type="secondary">
            {t(
              "profile.subtitle",
              "These values are stored once in the candidate profile and will be reused later for automatic CV generation.",
            )}
          </Text>
          <div className="responsive-toolbar" style={{ marginTop: 8 }}>
            <Tag color="blue">
              {t("profile.autoSaveEnabled", "Auto-save enabled")}
            </Tag>
            <Text type="secondary">
              {t(
                "profile.autoSavesAfterChanges",
                "Auto-saves after changes",
              )}
            </Text>
          </div>
        </div>

        <Button type="primary" onClick={openModal}>
          {t("profile.addOrUpdate", "Add / Update Attribute Value")}
        </Button>
      </div>

      <div className="responsive-toolbar responsive-toolbar--actions" style={{ marginBottom: 16 }}>
        <Text className="responsive-toolbar__meta" type="secondary">
          {t("common.selected", "Selected")}: {selectedRowKeys.length}
        </Text>

        <Popconfirm
          title={t(
            "profile.deleteConfirmTitle",
            "Delete selected profile values?",
          )}
          description={t(
            "profile.deleteConfirmBody",
            "This will remove values only from candidate profile, not from Attribute Library.",
          )}
          okText={t("common.delete", "Delete")}
          cancelText={t("common.cancel", "Cancel")}
          disabled={selectedRowKeys.length === 0}
          onConfirm={() => deleteMutation.mutate(selectedRowKeys)}
        >
          <Button
            danger
            disabled={selectedRowKeys.length === 0}
            loading={deleteMutation.isPending}
          >
            {t("profile.deleteSelected", "Delete Selected")}
          </Button>
        </Popconfirm>
      </div>

      {isError ? (
        <Alert
          type="error"
          message={t("profile.loadError", "Failed to load profile attributes")}
          style={{ marginBottom: 16 }}
        />
      ) : null}

      <Table
        className="responsive-table"
        rowKey="id"
        rowSelection={rowSelection}
        columns={columns}
        dataSource={profileAttributes}
        loading={isLoading}
        pagination={false}
        scroll={!screens.lg ? { x: 900 } : undefined}
      />

      <Modal
        className="responsive-modal"
        title={t("profile.addOrUpdate", "Add / Update Attribute Value")}
        open={isModalOpen}
        onCancel={closeModal}
        onOk={handleSubmit}
        okText={modalOkText}
        okButtonProps={{ disabled: saveMutation.isPending }}
        confirmLoading={saveMutation.isPending && saveStatus === "saving"}
        destroyOnHidden
        width={screens.md ? 720 : "calc(100vw - 24px)"}
      >
        <Form
          className="responsive-form"
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          onValuesChange={handleFormValuesChange}
        >
          <Form.Item
            label={t("profile.attribute", "Attribute")}
            name="attributeId"
            rules={[
              {
                required: true,
                message: t(
                  "profile.selectAttribute",
                  "Please select attribute",
                ),
              },
            ]}
          >
            <Select
              showSearch
              placeholder={t("profile.attributePlaceholder", "Select attribute")}
              optionFilterProp="label"
              onChange={(value) => {
                resetAutoSaveState();
                applyAttributeSelection(value);
              }}
              options={attributes.map((attribute) => ({
                label: `${attribute.name} (${attribute.type})`,
                value: attribute.id,
              }))}
            />
          </Form.Item>

          <Form.Item
            key={selectedAttribute?.type || "empty"}
            label={t("profile.value", "Value")}
            name="value"
            valuePropName={
              selectedAttribute?.type === "BOOLEAN" ? "checked" : "value"
            }
          >
            {renderValueInput(selectedAttribute, t)}
          </Form.Item>

          <Space
            direction="vertical"
            size={4}
            style={{ width: "100%", marginTop: 8 }}
          >
            <Space wrap>
              <Tag color="blue">
                {t("profile.autoSaveEnabled", "Auto-save enabled")}
              </Tag>
              {statusTag}
            </Space>
            <Text type="secondary">
              {t(
                "profile.changesAutoSaved",
                "Changes will be saved automatically",
              )}{" "}
              ({AUTO_SAVE_DELAY_MS / 1000}s)
            </Text>
            {lastSavedAt ? (
              <Text type="secondary">
                {t("profile.lastSaved", "Last saved")} {formatTime(lastSavedAt)}
              </Text>
            ) : null}
            {saveError ? <Text type="danger">{saveError}</Text> : null}
          </Space>
        </Form>
      </Modal>
    </Card>
  );
}
