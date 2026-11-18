-- Plan 47 done-proof: key and hash of every live row of every enabled door tab, the same way export.gs
-- canonicalHash_ does it (cells in tab_schema header order, each as <UTF-8 byte length>:<text>, sha256 hex).
-- Read-only; run attended as the owner right after Stephen's verifyNow(), then compare with the "verify" tab.
SELECT t.tab, t.row_key,
       encode(sha256(convert_to(string_agg(octet_length(convert_to(coalesce(t.row_raw->>h.name, ''), 'UTF8'))::text || ':'
                                           || coalesce(t.row_raw->>h.name, ''), '' ORDER BY h.ord), 'UTF8')), 'hex') AS sha256
FROM research.tab_row t
JOIN research.import_batch b ON b.batch_id = t.import_batch_id AND b.state = 'applied'
JOIN research.tab_schema s ON s.tab = t.tab AND s.enabled
CROSS JOIN LATERAL unnest(s.headers) WITH ORDINALITY AS h(name, ord)
WHERE t.live
GROUP BY t.tab, t.row_key
ORDER BY t.tab, t.row_key COLLATE "C";
