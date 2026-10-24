"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ExternalLink } from "@/components/icons";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { RichTextEditor } from "@/components/admin/fields/rich-text-editor";
import { Field } from "@/components/site/field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deletePage, savePage } from "@/lib/actions/admin/pages";
import { slugify } from "@/lib/listing";
import { PAGE_SECTION_LABEL, PAGE_SECTIONS, pageSchema, type PageInput } from "@/lib/schemas/admin";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface PageFormProps {
  id: string | null;
  initial: PageInput;
  publicSlug?: string;
}

export function PageForm({ id, initial, publicSlug }: PageFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<PageInput>({ resolver: zodResolver(pageSchema), defaultValues: initial });

  const slug = useWatch({ control, name: "slug" });
  const section = useWatch({ control, name: "section" });

  const onSubmit = handleSubmit(async (values) => {
    const result = await savePage(id, values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof PageInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the page.");
      return;
    }
    toast.success(id ? "Page saved." : "Page created.");
    if (!id && result.id) {
      router.replace(`/admin/pages/${result.id}`);
      return;
    }
    reset(values);
    router.refresh();
  });

  const err = (name: string) => (name in errors ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <FormSection title="Page">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field id="title" label="Title" error={errors.title?.message}>
            <Input
              id="title"
              aria-invalid={Boolean(errors.title)}
              aria-describedby={err("title")}
              {...register("title", {
                onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                  // New pages get a slug from the title until the slug is edited by hand.
                  if (!id && !dirtyFields.slug) setValue("slug", slugify(e.target.value));
                },
              })}
            />
          </Field>
          <Field
            id="slug"
            label="Slug"
            hint={section === "legal" ? `The address: /legal/${slug || "…"}` : "A short name for this block; it is not shown on the site."}
            error={errors.slug?.message}
          >
            <Input id="slug" aria-invalid={Boolean(errors.slug)} aria-describedby={err("slug") ?? "slug-hint"} {...register("slug")} />
          </Field>
        </div>
        <Field id="section" label="Shows on" hint="Join Our Team pages are blocks of text: the first one above the positions is the page title and intro." error={errors.section?.message}>
          <Controller
            control={control}
            name="section"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger id="section" className="w-full sm:max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAGE_SECTIONS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {PAGE_SECTION_LABEL[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field id="content" label="Content" error={errors.content?.message}>
          <Controller
            control={control}
            name="content"
            render={({ field }) => <RichTextEditor id="content" value={field.value} onChange={field.onChange} invalid={Boolean(errors.content)} />}
          />
        </Field>
        {publicSlug ? (
          <Button asChild variant="outline">
            <a href={section === "legal" ? `/legal/${publicSlug}` : "/careers"} target="_blank" rel="noreferrer">
              View on the site
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </Button>
        ) : null}
      </FormSection>

      <SaveBar
        pending={isSubmitting}
        dirty={isDirty}
        label={id ? "Save changes" : "Create page"}
        start={
          id ? (
            <DeleteButton name={initial.title} consequence="Its address stops working and links to it break." action={deletePage.bind(null, id)} redirectTo="/admin/pages" />
          ) : null
        }
      />
    </form>
  );
}
