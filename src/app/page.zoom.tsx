const scaleRef = useRef(1);
const [scale, setScale] = useState(1);
const translateRef = useRef({ x: 0, y: 0 });
const [translate, setTranslate] = useState({ x: 0, y: 0 });
const pinchStartRef = useRef<any>(null);
const panStartRef = useRef<any>(null);

const clamp = (val: number, min: number, max: number) =>
  Math.max(min, Math.min(max, val));

const getBounds = (containerRect: DOMRect, contentRect: DOMRect, s: number) => {
  const scaledW = contentRect.width * s;
  const scaledH = contentRect.height * s;
  const maxX = Math.max(0, (scaledW - containerRect.width) / 2);
  const maxY = Math.max(0, (scaledH - containerRect.height) / 2);
  return { maxX, maxY };
};

const setTransform = (s: number, tx: number, ty: number) => {
  scaleRef.current = s;
  translateRef.current = { x: tx, y: ty };
  setScale(s);
  setTranslate({ x: tx, y: ty });
};

const onTouchStartZoom = (e: React.TouchEvent) => {
  if (!draggableNodeRef.current) return;
  if (e.touches.length === 2) {
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const dx = t1.clientX - t0.clientX;
    const dy = t1.clientY - t0.clientY;
    const distance = Math.hypot(dx, dy);
    const rect = draggableNodeRef.current.getBoundingClientRect();
    const cx = (t0.clientX + t1.clientX) / 2;
    const cy = (t0.clientY + t1.clientY) / 2;
    const centerRel = {
      x: cx - rect.left - rect.width / 2,
      y: cy - rect.top - rect.height / 2,
    };
    pinchStartRef.current = {
      distance,
      centerRel,
      startScale: scaleRef.current,
      startTranslate: { ...translateRef.current },
      containerRect: rect,
      contentRect: rect,
    };
  } else if (e.touches.length === 1) {
    const t = e.touches[0];
    panStartRef.current = {
      x: t.clientX,
      y: t.clientY,
      startTranslate: { ...translateRef.current },
    };
  }
};

const onTouchMoveZoom = (e: React.TouchEvent) => {
  if (!draggableNodeRef.current) return;
  if (e.touches.length === 2 && pinchStartRef.current) {
    const t0 = e.touches[0];
    const t1 = e.touches[1];
    const dx = t1.clientX - t0.clientX;
    const dy = t1.clientY - t0.clientY;
    const distance = Math.hypot(dx, dy);
    const ratio = distance / pinchStartRef.current.distance;
    let newScale = clamp(pinchStartRef.current.startScale * ratio, 1, 4);
    const centerRel = pinchStartRef.current.centerRel;
    const startScale = pinchStartRef.current.startScale;
    const startTranslate = pinchStartRef.current.startTranslate;
    const sChange = newScale / startScale;
    const tx = startTranslate.x + centerRel.x * (1 - sChange);
    const ty = startTranslate.y + centerRel.y * (1 - sChange);
    const bounds = getBounds(
      pinchStartRef.current.containerRect,
      pinchStartRef.current.contentRect,
      newScale
    );
    const clampedX = clamp(tx, -bounds.maxX, bounds.maxX);
    const clampedY = clamp(ty, -bounds.maxY, bounds.maxY);
    setTransform(newScale, clampedX, clampedY);
    e.preventDefault();
  } else if (e.touches.length === 1 && panStartRef.current) {
    const t = e.touches[0];
    const dx = t.clientX - panStartRef.current.x;
    const dy = t.clientY - panStartRef.current.y;
    const tx = panStartRef.current.startTranslate.x + dx;
    const ty = panStartRef.current.startTranslate.y + dy;
    const rect = draggableNodeRef.current.getBoundingClientRect();
    const contentRect = rect;
    const bounds = getBounds(rect, contentRect, scaleRef.current);
    const clampedX = clamp(tx, -bounds.maxX, bounds.maxX);
    const clampedY = clamp(ty, -bounds.maxY, bounds.maxY);
    setTransform(scaleRef.current, clampedX, clampedY);
    e.preventDefault();
  }
};

const onTouchEndZoom = (e: React.TouchEvent) => {
  pinchStartRef.current = null;
  panStartRef.current = null;
  if (scaleRef.current <= 1) {
    setTransform(1, 0, 0);
  }
};

const onWheelZoom = (e: React.WheelEvent) => {
  if (!draggableNodeRef.current) return;
  const isZoomGesture = e.ctrlKey || e.metaKey;
  if (!isZoomGesture) {
    if (scaleRef.current > 1) {
      const rect = draggableNodeRef.current.getBoundingClientRect();
      const contentRect = rect;
      const deltaX = e.deltaX;
      const deltaY = e.deltaY;
      const tx = translateRef.current.x - deltaX;
      const ty = translateRef.current.y - deltaY;
      const bounds = getBounds(rect, contentRect, scaleRef.current);
      const clampedX = clamp(tx, -bounds.maxX, bounds.maxX);
      const clampedY = clamp(ty, -bounds.maxY, bounds.maxY);
      setTransform(scaleRef.current, clampedX, clampedY);
      e.preventDefault();
    }
    return;
  }
  const rect = draggableNodeRef.current.getBoundingClientRect();
  const cx = e.clientX - rect.left - rect.width / 2;
  const cy = e.clientY - rect.top - rect.height / 2;
  const zoomFactor = Math.exp(-e.deltaY * 0.0015);
  let newScale = clamp(scaleRef.current * zoomFactor, 1, 4);
  const sChange = newScale / scaleRef.current;
  const tx = translateRef.current.x + cx * (1 - sChange);
  const ty = translateRef.current.y + cy * (1 - sChange);
  const bounds = getBounds(rect, rect, newScale);
  const clampedX = clamp(tx, -bounds.maxX, bounds.maxX);
  const clampedY = clamp(ty, -bounds.maxY, bounds.maxY);
  setTransform(newScale, clampedX, clampedY);
  e.preventDefault();
};
