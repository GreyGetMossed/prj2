import { connectDatabase } from '../../server/database.js';
import { ResumeItem } from '../../server/models.js';

export default async (request) => {
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET' } });
  }

  try {
    await connectDatabase();
    const cat = new URL(request.url).searchParams.get("category");
    const filter = (cat)? {category: cat}:{}
    const items = await ResumeItem.find(filter).lean();
    return Response.json(items);
  } catch (error) {
    console.error('Resume API error:', error.name);
    return Response.json({ error: 'Unable to process the request. Please try again later.' }, { status: 500 });
  }
};

export const config = { path: '/api/resume-items' };
