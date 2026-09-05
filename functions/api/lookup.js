import { processLookup } from '../../lookup-service.js';

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);
  const query = url.searchParams.get('q') || 
                url.searchParams.get('w') || 
                url.searchParams.get('c') || 
                url.searchParams.get('word') || 
                url.searchParams.get('code') || '';

  const result = processLookup(query);

  return new Response(JSON.stringify(result, null, 2), {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
