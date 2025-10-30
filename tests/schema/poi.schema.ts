import { z } from "zod";

export const zPOI = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  description: z.string().min(1),
  coords: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  neighborhood: z.string().min(1),
  tags: z.array(z.string()),
  year: z.number(),
  sources: z.array(z.object({
    title: z.string().min(1),
    url: z.string().url(),
    publisher: z.string().min(1)
  })),
  images: z.array(z.object({
    src: z.string().min(1),
    credit: z.string().min(1),
    license: z.string().min(1)
  })),
  borough: z.literal("Manhattan"),
  area: z.enum(["Union Square", "Flatiron District"]),
  block: z.string().min(1),
  route_id: z.string().optional(),
  order: z.number().optional()
});

export type POI = z.infer<typeof zPOI>;
