import React from 'react';
import { useForm } from 'react-hook-form';
import type { S3ClientType } from '../App';

function Settings({ s3ClientKey }: { s3ClientKey: S3ClientType }) {
  const { register, handleSubmit } = useForm<S3ClientType>({
    values: s3ClientKey,
  });
  const onSubmit = (data: S3ClientType) => {
    parent.postMessage(
      {
        pluginMessage: {
          key: 'S3',
          data: {
            credentials: {
              accessKeyId: data.credentials.accessKeyId,
              secretAccessKey: data.credentials.secretAccessKey,
            },
            folder: data.folder,
            region: data.region,
            Bucket: data.Bucket,
          },
        },
      },
      '*',
    );
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="row">
        <label>AWS AccessKey</label>
        <input {...register('credentials.accessKeyId')} />
      </div>
      <div className="row">
        <label>AWS Secret Access Key</label>
        <input {...register('credentials.secretAccessKey')} />
      </div>
      <div className="row">
        <label>AWS Region</label>
        <input {...register('region')} />
      </div>
      <div className="row">
        <label>S3 Bucket Name</label>
        <input {...register('Bucket')} />
      </div>
      <div className="row">
        <label>S3 Bucket Folder</label>
        <input {...register('folder')} />
      </div>
      <button>Save Settings</button>
    </form>
  );
}

export default Settings;
