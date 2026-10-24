"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "@/components/icons";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { GalleryField } from "@/components/admin/fields/gallery-field";
import { ImageField } from "@/components/admin/fields/image-field";
import { ListField } from "@/components/admin/fields/list-field";
import { RichTextEditor } from "@/components/admin/fields/rich-text-editor";
import { VideoField } from "@/components/admin/fields/video-field";
import { Field } from "@/components/site/field";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { deleteProject, saveProject } from "@/lib/actions/admin/projects";
import { slugify } from "@/lib/listing";
import { PLATFORM_OPTIONS, projectSchema, type ProjectInput } from "@/lib/schemas/admin";

const PLATFORM_LABELS: Record<(typeof PLATFORM_OPTIONS)[number], string> = { android: "Android", ios: "iOS", web: "Web", desktop: "Desktop" };

interface ProjectFormProps {
  id: string | null;
  initial: ProjectInput;
  categories: { value: string; label: string }[];
  /** Live URL of the saved project, for the "View" link. */
  publicSlug?: string;
}

export function ProjectForm({ id, initial, categories, publicSlug }: ProjectFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    getValues,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<ProjectInput>({ resolver: zodResolver(projectSchema), defaultValues: initial });

  const [title, slug] = useWatch({ control, name: ["title", "slug"] });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveProject(id, values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof ProjectInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the project.");
      return;
    }
    toast.success(id ? "Project saved." : "Project created.");
    if (!id && result.id) {
      router.replace(`/admin/projects/${result.id}`);
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
                    // New projects get a slug from the title until the slug is edited by hand.
                    if (!id && !dirtyFields.slug) setValue("slug", slugify(e.target.value));
                  },
                })}
              />
            </Field>
            <Field id="slug" label="Slug" hint={`The address: /work/${slug || "…"}`} error={errors.slug?.message}>
              <Input id="slug" aria-invalid={Boolean(errors.slug)} aria-describedby={err("slug") ?? "slug-hint"} {...register("slug")} />
            </Field>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field id="client" label="Client" optional error={errors.client?.message}>
                <Input id="client" {...register("client")} />
              </Field>
              <Field id="date" label="Launch date" optional error={errors.date?.message}>
                <Input id="date" type="date" aria-invalid={Boolean(errors.date)} {...register("date")} />
              </Field>
            </div>
            <Field id="summary" label="Summary" hint="One or two sentences for cards and search results." error={errors.summary?.message}>
              <Textarea id="summary" rows={3} maxLength={320} aria-describedby={err("summary") ?? "summary-hint"} {...register("summary")} />
            </Field>
          </FormSection>

          <FormSection title="Case study" description="The story on the project page.">
            <Field id="body" label="Body" error={errors.body?.message}>
              <Controller control={control} name="body" render={({ field }) => <RichTextEditor id="body" value={field.value} onChange={field.onChange} />} />
            </Field>
            <Field id="features" label="Key features" optional error={errors.features?.message}>
              <Controller
                control={control}
                name="features"
                render={({ field }) => <ListField id="features" value={field.value} onChange={field.onChange} placeholder="e.g. Prayer tracking" />}
              />
            </Field>
          </FormSection>

          <FormSection title="Images and video">
            <Field id="cover" label="Cover" hint="Shown on cards and at the top of the project page." error={errors.cover?.message}>
              <Controller
                control={control}
                name="cover"
                render={({ field }) => <ImageField id="cover" value={field.value} onChange={field.onChange} defaultAlt={title} invalid={Boolean(errors.cover)} />}
              />
            </Field>
            <Field id="gallery" label="Gallery" optional hint="Screens shown on the project page, in this order." error={errors.gallery?.message}>
              <Controller
                control={control}
                name="gallery"
                render={({ field }) => <GalleryField id="gallery" value={field.value} onChange={field.onChange} defaultAlt={title} />}
              />
            </Field>
            <Field
              id="video"
              label="Preview video"
              optional
              hint="Plays muted on a loop on the home page card. Without one, the card plays the gallery screens."
              error={errors.video?.message}
            >
              <Controller
                control={control}
                name="video"
                render={({ field }) => <VideoField id="video" value={field.value} onChange={field.onChange} invalid={Boolean(errors.video)} />}
              />
            </Field>
          </FormSection>

          <FormSection title="Links" description="Leave empty what does not apply.">
            {(["playStore", "appStore", "website"] as const).map((key) => (
              <Field
                key={key}
                id={`links.${key}`}
                label={key === "playStore" ? "Google Play" : key === "appStore" ? "App Store" : "Website"}
                optional
                error={errors.links?.[key]?.message}
              >
                <Input id={`links.${key}`} type="url" placeholder="https://" aria-invalid={Boolean(errors.links?.[key])} {...register(`links.${key}`)} />
              </Field>
            ))}
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
            <Field id="categoryId" label="Category" error={errors.categoryId?.message}>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select value={field.value || undefined} onValueChange={field.onChange}>
                    <SelectTrigger id="categoryId" className="w-full" aria-invalid={Boolean(errors.categoryId)}>
                      <SelectValue placeholder="Choose one" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
            <div className="flex min-h-11 items-center justify-between gap-3">
              <label htmlFor="featured" className="text-sm font-medium">
                Feature on the home page
              </label>
              <Controller control={control} name="featured" render={({ field }) => <Switch id="featured" checked={field.value} onCheckedChange={field.onChange} />} />
            </div>
            <Field id="order" label="Position" hint="Lower numbers come first." error={errors.order?.message}>
              <Input id="order" type="number" min={0} max={9999} {...register("order", { valueAsNumber: true })} />
            </Field>
          </FormSection>

          <FormSection title="Platforms">
            <fieldset className="grid grid-cols-2 gap-2">
              <legend className="sr-only">Platforms</legend>
              <Controller
                control={control}
                name="platforms"
                render={({ field }) => (
                  <>
                    {PLATFORM_OPTIONS.map((p) => (
                      <label key={p} className="flex min-h-11 items-center gap-2 text-sm">
                        <Checkbox
                          checked={field.value.includes(p)}
                          onCheckedChange={(checked) => field.onChange(checked ? [...field.value, p] : field.value.filter((x) => x !== p))}
                        />
                        {PLATFORM_LABELS[p]}
                      </label>
                    ))}
                  </>
                )}
              />
            </fieldset>
          </FormSection>

          {publicSlug && getValues("status") === "published" ? (
            <Button asChild variant="outline" className="w-full">
              <a href={`/work/${publicSlug}`} target="_blank" rel="noreferrer">
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
        label={id ? "Save changes" : "Create project"}
        start={
          id ? (
            <DeleteButton name={initial.title} consequence="It disappears from the work page and the home page." action={deleteProject.bind(null, id)} redirectTo="/admin/projects" />
          ) : null
        }
      />
    </form>
  );
}
