import React, { useEffect, useRef, useState } from 'react';
import { Buffer } from 'buffer';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import Settings from './components/Settings';
import Upload from './components/Upload';

window.Buffer = Buffer;

const tabList = ['Settings', 'Upload'] as const;
type TabType = (typeof tabList)[number];

export type S3ClientType = {
  credentials: {
    accessKeyId: string;
    secretAccessKey: string;
  };

  Bucket: string;
  region: string;
};

function App() {
  const s3Ref = useRef<S3Client>();
  const [tab, setTab] = useState<TabType>('Settings');
  const [s3ClientKey, setS3ClientKey] = useState<S3ClientType | null>(null);
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
            Key: `${event.data.pluginMessage.name}.${format || 'png'}`,
            Body: buffer, // 파일 데이터
            ContentType: format
              ? format === 'png'
                ? 'image/png'
                : 'image/jpeg'
              : 'image/png',
          };
          const output = await s3Ref.current.send(new PutObjectCommand(params));
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
        <Upload images={images} />
      )}
    </div>
  );
}

export default App;
