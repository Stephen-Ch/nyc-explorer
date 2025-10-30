import { test, expect } from '@playwright/test';
import { z } from 'zod';
import { readFileSync } from 'fs';
import { join } from 'path';

const POISchema = z.object({
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

const POIArraySchema = z.array(POISchema);

test('content/poi.v1.json matches schema', () => {
  const filePath = join(process.cwd(), 'content', 'poi.v1.json');
  const rawData = readFileSync(filePath, 'utf-8');
  const data = JSON.parse(rawData);
  POIArraySchema.parse(data);
});
