figma.showUI(__html__);
figma.ui.resize(720, 600);

let queue = [];
const unit = [];

function getLocalData(key) {
  return figma.clientStorage.getAsync(key);
}
function findAllImageFills(node) {
  let fillsList = [];

  // 현재 노드에 fills 필드가 있으면 type이 IMAGE인 항목만 추가
  if (node.fills && Array.isArray(node.fills)) {
    const imageFills = node.fills.filter((fill) => fill.type === 'IMAGE');
    if (imageFills?.[0]) {
      fillsList.push({ nodeId: node.id, name: node.name });
    }
  }

  // children 필드가 있으면 반복적으로 하위 노드를 탐색
  if (node.children && Array.isArray(node.children)) {
    for (const child of node.children) {
      fillsList = fillsList.concat(findAllImageFills(child));
    }
  }

  return fillsList;
}

// 선택된 노드들 중 이미지 노드만 큐에 추가
for (const node of figma.currentPage.selection) {
  const nodes = findAllImageFills(node);
  queue = queue.concat(nodes);
}
async function invertImages(node) {
  console.log('success');

  unit.push(node);
}

async function processQueue() {
  getLocalData('S3').then((config) => {
    figma.ui.postMessage({ type: 'S3', config });
  });
  console.log('queue', queue);
  for (const node of queue) {
    await invertImages(node);
  }
  console.log('unit', unit);

  figma.ui.postMessage({ type: 'image', unit });
}

processQueue();

figma.ui.onmessage = async (msg) => {
  switch (msg.key) {
    case 'S3':
      figma.clientStorage.setAsync('S3', msg.data);
      break;
    case 'cancel':
      figma.closePlugin();
      break;
    case 'upload': {
      for (const node of msg.data.images) {
        const nodeBy = await figma.getNodeByIdAsync(node.nodeId);
        const pngBytes = await nodeBy.exportAsync({
          format: node.format || 'PNG',
          constraint: { type: 'SCALE', value: Number(node.value) || 2 },
        });
        // 내보낸 데이터를 활용하는 로직 작성
        figma.ui.postMessage({
          type: 'upload',
          name: node.name,
          format: node.format,
          buffer: pngBytes,
        });
      }

      break;
    }

    default:
      break;
  }
};
