import React, { useEffect, useRef, useState } from 'react';
import { Buffer } from 'buffer';
import {
  S3Client,
  PutObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
} from '@aws-sdk/client-s3';
import Settings from './components/Settings';
import Upload from './components/Upload';

function formatBytes(bytes) {
  const units = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;

  while (bytes >= 1024 && i < units.length - 1) {
    bytes /= 1024;
    i++;
  }

  return `${bytes.toFixed(2)} ${units[i]}`;
}
function formatDate(dateString) {
  const date = new Date(dateString);

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const timezone = date
    .toLocaleTimeString('en-US', { timeZoneName: 'short' })
    .split(' ')[2];

  return `${year}. ${month}. ${day}. ${period.toLowerCase()} ${displayHours}:${minutes}:${seconds} ${period}`;
}
window.Buffer = Buffer;

const tabList = ['Settings', 'Upload'] as const;
type TabType = (typeof tabList)[number];

export type S3ClientType = {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };
  folder: string;
  Bucket: string;
  region: string;
};

function App() {
  const s3Ref = useRef<S3Client>();
  const [tab, setTab] = useState<TabType>('Settings');
  const [s3ClientKey, setS3ClientKey] = useState<S3ClientType | null>(null);
  const [list, setList] = useState([]);
  const [images, setImages] = useState([]);
  useEffect(() => {
    window.addEventListener('message', async (event) => {
      switch (event.data.pluginMessage.type) {
        case 'S3': {
          s3Ref.current = new S3Client({
            credentials: {
              accessKeyId:
                event.data.pluginMessage.config.credentials.accessKeyId,
              secretAccessKey:
                event.data.pluginMessage.config.credentials.secretAccessKey,
            },
            region: event.data.pluginMessage.config.region,
          });
          setS3ClientKey({
            credentials: {
              accessKeyId:
                event.data.pluginMessage.config.credentials.accessKeyId,
              secretAccessKey:
                event.data.pluginMessage.config.credentials.secretAccessKey,
            },
            region: event.data.pluginMessage.config.region,
            Bucket: event.data.pluginMessage.config.Bucket,
            folder: event.data.pluginMessage.config.folder,
          });
          setTab('Upload');
          break;
        }
        case 'image': {
          console.log('event.data.pluginMessage', event.data.pluginMessage);
          setImages(event.data.pluginMessage.unit);
          break;
        }
        case 'upload': {
          const buffer = Buffer.from(event.data.pluginMessage.buffer, 'binary');
          const { format } = event.data.pluginMessage;
          const params = {
            Bucket: s3ClientKey?.Bucket, // S3 버킷 이름
            Key: s3ClientKey.folder
              ? `${s3ClientKey.folder}/${event.data.pluginMessage.name}.${
                  format || 'png'
                }`
              : `${event.data.pluginMessage.name}.${format || 'png'}`,
            Body: buffer, // 파일 데이터
            ContentType: format
              ? format === 'png'
                ? 'image/png'
                : 'image/jpeg'
              : 'image/png',
          };
          try {
            // 중복 파일 여부 확인
            await s3Ref.current.send(
              new HeadObjectCommand({ Bucket: params.Bucket, Key: params.Key }),
            );
            if (
              window.confirm(
                `"${params.Key}"경로에 파일이 이미 존재합니다. 덮어쓰기 하시겠습니까?`,
              )
            ) {
              const output = await s3Ref.current.send(
                new PutObjectCommand(params),
              );
              if (output.$metadata.httpStatusCode) {
                parent.postMessage(
                  {
                    pluginMessage: {
                      key: 'complete',
                      data: '',
                    },
                  },
                  '*',
                );
              }
            }
          } catch (error) {
            if (error.name === 'NotFound') {
              const output = await s3Ref.current.send(
                new PutObjectCommand(params),
              );
              if (output.$metadata.httpStatusCode) {
                parent.postMessage(
                  {
                    pluginMessage: {
                      key: 'complete',
                      data: '',
                    },
                  },
                  '*',
                );
              }
            } else {
              throw error;
            }
          }

          break;
        }
        default:
          break;
      }
    });
  }, [s3ClientKey]);

  const handleTabClick = (item: TabType) => {
    setTab(item);
  };
  const getList = async () => {
    if (list.length) {
      setList([]);
      return;
    }
    const params = {
      Bucket: s3ClientKey?.Bucket, // S3 버킷 이름
    };
    const data = await s3Ref.current.send(new ListObjectsV2Command(params));
    console.log(data);
    setList(data.Contents.filter((v) => v.Key.startsWith(s3ClientKey.folder)));
  };
  return (
    <div className="container">
      <div className="tab">
        {tabList.map((item) => {
          return (
            <div
              key={item}
              role="button"
              className={tab === item ? 'active' : ''}
              onClick={() => handleTabClick(item)}
            >
              {item}
            </div>
          );
        })}
      </div>
      {tab === 'Settings' ? (
        <Settings s3ClientKey={s3ClientKey} />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '8px',
              marginBottom: '8px',
              cursor: 'pointer',
            }}
          >
            <label>일괄적용</label>
            <div
              onClick={getList}
              style={{
                border: '1px solid #111',
                padding: '4px',
                fontSize: '12px',
                borderRadius: '4px',
              }}
            >
              {list.length > 0
                ? 'S3목록 닫기'
                : `S3 ${s3ClientKey.folder}/ 폴더 에서 목록 가져오기`}
            </div>
          </div>
          {list.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>이름</th>
                  <th>마지막 수정</th>
                  <th>크기</th>
                </tr>
              </thead>
              <tbody>
                {list.map((item) => {
                  return (
                    <tr key={item.Key}>
                      <td>{item.Key.replace(`${s3ClientKey.folder}/`, '')}</td>
                      <td>{formatDate(item.LastModified)}</td>
                      <td>{formatBytes(item.Size)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          <Upload images={images} />
        </div>
      )}
    </div>
  );
}

export default App;
