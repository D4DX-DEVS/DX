"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { ImageField } from "@/components/admin/fields/image-field";
import { ListField } from "@/components/admin/fields/list-field";
import { RichTextEditor } from "@/components/admin/fields/rich-text-editor";
import { Field } from "@/components/site/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { deletePost, savePost } from "@/lib/actions/admin/posts";
import { slugify } from "@/lib/listing";
import { postSchema, type PostInput } from "@/lib/schemas/admin";

interface PostFormProps {
  id: string | null;
  initial: PostInput;
  /** Live URL of the saved post, for the "View" link. */
  publicSlug?: string;
}

export function PostForm({ id, initial, publicSlug }: PostFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<PostInput>({ resolver: zodResolver(postSchema), defaultValues: initial });

  const [title, slug, status] = useWatch({ control, name: ["title", "slug", "status"] });

  const onSubmit = handleSubmit(async (values) => {
    const result = await savePost(id, values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof PostInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the post.");
      return;
    }
    toast.success(id ? "Post saved." : "Post created.");
    if (!id && result.id) {
      router.replace(`/admin/posts/${result.id}`);
      return;
    }
    reset(values);
    router.refresh();
  });

  const err = (name: string) => (name in errors ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="space-y-6">
          <FormSection title="Basics">
            <Field id="title" label="Title" error={errors.title?.message}>
              <Input
                id="title"
                aria-invalid={Boolean(errors.title)}
                aria-describedby={err("title")}
                {...register("title", {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                    // New posts get a slug from the title until the slug is edited by hand.
                    if (!id && !dirtyFields.slug) setValue("slug", slugify(e.target.value));
                  },
                })}
              />
            </Field>
            <Field id="slug" label="Slug" hint={`The address: /blog/${slug || "…"}`} error={errors.slug?.message}>
              <Input id="slug" aria-invalid={Boolean(errors.slug)} aria-describedby={err("slug") ?? "slug-hint"} {...register("slug")} />
            </Field>
            <Field id="excerpt" label="Excerpt" optional hint="Shown on the blog list. Left empty, it is taken from the start of the post." error={errors.excerpt?.message}>
              <Textarea id="excerpt" rows={3} maxLength={320} aria-describedby={err("excerpt") ?? "excerpt-hint"} {...register("excerpt")} />
            </Field>
          </FormSection>

          <FormSection title="Content">
            <Field id="content" label="Post" error={errors.content?.message}>
              <Controller
                control={control}
                name="content"
                render={({ field }) => <RichTextEditor id="content" value={field.value} onChange={field.onChange} images invalid={Boolean(errors.content)} />}
              />
            </Field>
          </FormSection>
        </div>

        <div className="space-y-6">
          <FormSection title="Publishing">
            <Field id="status" label="Status" error={errors.status?.message}>
              <Controller
                control={control}
                name="status"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="draft">Draft (hidden from the site)</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <Field id="publishedAt" label="Publish date" optional hint="Published posts without a date get today's." error={errors.publishedAt?.message}>
              <Input id="publishedAt" type="date" aria-invalid={Boolean(errors.publishedAt)} aria-describedby={err("publishedAt") ?? "publishedAt-hint"} {...register("publishedAt")} />
            </Field>
            <Field id="tags" label="Tags" optional error={errors.tags?.message}>
              <Controller
                control={control}
                name="tags"
                render={({ field }) => <ListField id="tags" value={field.value} onChange={field.onChange} placeholder="e.g. Flutter" max={12} maxLength={40} />}
              />
            </Field>
          </FormSection>

          <FormSection title="Cover image">
            <Field id="cover" label="Cover" optional hint="Shown on the blog list and at the top of the post." error={errors.cover?.message}>
              <Controller control={control} name="cover" render={({ field }) => <ImageField id="cover" value={field.value} onChange={field.onChange} defaultAlt={title} />} />
            </Field>
          </FormSection>

          {publicSlug && status === "published" ? (
            <Button asChild variant="outline" className="w-full">
              <a href={`/blog/${publicSlug}`} target="_blank" rel="noreferrer">
                View on the site
                <ExternalLink className="size-4" aria-hidden="true" />
              </a>
            </Button>
          ) : null}
        </div>
      </div>

      <SaveBar
        pending={isSubmitting}
        dirty={isDirty}
        label={id ? "Save changes" : "Create post"}
        start={id ? <DeleteButton name={initial.title} consequence="It disappears from the blog." action={deletePost.bind(null, id)} redirectTo="/admin/posts" /> : null}
      />
    </form>
  );
}
