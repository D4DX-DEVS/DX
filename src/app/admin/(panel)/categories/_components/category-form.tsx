"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { DeleteButton } from "@/components/admin/delete-button";
import { FormSection, SaveBar } from "@/components/admin/fields/form-shell";
import { Field } from "@/components/site/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { deleteCategory, saveCategory } from "@/lib/actions/admin/categories";
import { slugify } from "@/lib/listing";
import { categorySchema, type CategoryInput } from "@/lib/schemas/admin";

interface CategoryFormProps {
  id: string | null;
  initial: CategoryInput;
}

export function CategoryForm({ id, initial }: CategoryFormProps) {
  const router = useRouter();
  const {
    register,
    control,
    handleSubmit,
    setError,
    setValue,
    reset,
    formState: { errors, isSubmitting, isDirty, dirtyFields },
  } = useForm<CategoryInput>({ resolver: zodResolver(categorySchema), defaultValues: initial });

  const slug = useWatch({ control, name: "slug" });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveCategory(id, values);
    if (!result.ok) {
      for (const [key, messages] of Object.entries(result.fieldErrors ?? {})) {
        if (messages?.[0]) setError(key as keyof CategoryInput, { message: messages[0] });
      }
      toast.error(result.message ?? "Could not save the category.");
      return;
    }
    toast.success(id ? "Category saved." : "Category created.");
    if (!id && result.id) {
      router.replace(`/admin/categories/${result.id}`);
      return;
    }
    reset(values);
    router.refresh();
  });

  const err = (name: keyof CategoryInput) => (errors[name] ? `${name}-error` : undefined);

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-6">
      <FormSection title="Category">
        <Field id="name" label="Name" error={errors.name?.message}>
          <Input
            id="name"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={err("name")}
            {...register("name", {
              onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
                // New categories get a slug from the name until the slug is edited by hand.
                if (!id && !dirtyFields.slug) setValue("slug", slugify(e.target.value));
              },
            })}
          />
        </Field>
        <Field id="slug" label="Slug" hint={`The filter address: /work?category=${slug || "…"}`} error={errors.slug?.message}>
          <Input id="slug" aria-invalid={Boolean(errors.slug)} aria-describedby={err("slug") ?? "slug-hint"} {...register("slug")} />
        </Field>
        <Field id="description" label="Description" optional error={errors.description?.message}>
          <Textarea id="description" rows={3} maxLength={300} aria-describedby={err("description")} {...register("description")} />
        </Field>
        <Field id="order" label="Position" hint="Lower numbers come first." error={errors.order?.message}>
          <Input id="order" type="number" min={0} max={9999} className="max-w-40" aria-describedby={err("order") ?? "order-hint"} {...register("order", { valueAsNumber: true })} />
        </Field>
      </FormSection>

      <SaveBar
        pending={isSubmitting}
        dirty={isDirty}
        label={id ? "Save changes" : "Create category"}
        start={
          id ? (
            <DeleteButton name={initial.name} consequence="Its filter disappears from the work page." action={deleteCategory.bind(null, id)} redirectTo="/admin/categories" />
          ) : null
        }
      />
    </form>
  );
}
