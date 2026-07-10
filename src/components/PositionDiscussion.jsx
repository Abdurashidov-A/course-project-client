import {
  Alert,
  Button,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Typography,
  message,
} from "antd";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  createPositionDiscussionPost,
  getPositionDiscussions,
} from "../api/positionApi";
import { useI18n } from "../i18n/I18nProvider";

const { Text, Title } = Typography;
const { TextArea } = Input;

function formatDate(value) {
  if (!value) {
    return "—";
  }

  return new Date(value).toLocaleString();
}

export function PositionDiscussion({ positionId, positionTitle, open, onClose }) {
  const [content, setContent] = useState("");
  const { t } = useI18n();

  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["positionDiscussions", positionId],
    queryFn: () => getPositionDiscussions(positionId),
    enabled: Boolean(open && positionId),
    refetchInterval: open && positionId ? 5000 : false,
  });

  const createPostMutation = useMutation({
    mutationFn: () => createPositionDiscussionPost(positionId, content.trim()),
    onSuccess: async () => {
      message.success(t("discussion.added", "Discussion post added"));
      setContent("");
      await refetch();
    },
    onError: (requestError) => {
      if (requestError.response?.status === 403) {
        message.warning(
          requestError.response?.data?.message ||
            t("discussion.noAccess", "You do not have access to this discussion."),
        );
        return;
      }

      if (requestError.response?.status === 400) {
        message.warning(
          requestError.response?.data?.message ||
            t("discussion.invalid", "Discussion content is invalid."),
        );
        return;
      }

      message.error(t("discussion.postError", "Failed to post discussion message"));
    },
  });

  function handlePost() {
    if (!content.trim()) {
      return;
    }

    createPostMutation.mutate();
  }

  return (
    <Modal
      title={`${t("discussion.title", "Discussion")} — ${positionTitle || t("nav.positions", "Position")}`}
      open={open}
      onCancel={onClose}
      footer={null}
      width={800}
      destroyOnHidden
    >
      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        <div>
          <Title level={5} style={{ marginBottom: 4 }}>
            {t("discussion.positionTitle", "Position Discussion")}
          </Title>
          <Text type="secondary">
            {t(
              "discussion.subtitle",
              "Posts appear oldest to newest and refresh every 5 seconds while open.",
            )}
          </Text>
        </div>

        {isError ? (
          <Alert
            type="error"
            message={t("discussion.loadError", "Failed to load discussion")}
            description={error?.response?.data?.message}
            showIcon
          />
        ) : null}

        <List
          bordered
          loading={isLoading}
          dataSource={data?.posts || []}
          locale={{
            emptyText: (
              <Empty description={t("discussion.noPosts", "No discussion posts yet")} />
            ),
          }}
          renderItem={(post) => (
            <List.Item>
              <Space direction="vertical" size={4} style={{ width: "100%" }}>
                <Space wrap>
                  <Text strong>{post.author?.name || t("discussion.unknownUser", "Unknown user")}</Text>
                  <Text type="secondary">{post.author?.email || t("common.none", "—")}</Text>
                  <Text type="secondary">{formatDate(post.createdAt)}</Text>
                </Space>
                <Text style={{ whiteSpace: "pre-wrap" }}>{post.content}</Text>
              </Space>
            </List.Item>
          )}
        />

        <Space direction="vertical" size="small" style={{ width: "100%" }}>
          <TextArea
            rows={4}
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={1000}
            placeholder={t("discussion.placeholder", "Write your message")}
          />
          <Space style={{ width: "100%", justifyContent: "space-between" }}>
            <Text type="secondary">{content.trim().length}/1000</Text>
            <Button
              type="primary"
              onClick={handlePost}
              loading={createPostMutation.isPending}
              disabled={!content.trim()}
            >
              {t("discussion.post", "Post")}
            </Button>
          </Space>
        </Space>
      </Space>
    </Modal>
  );
}
