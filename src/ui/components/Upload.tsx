import React, { useEffect, useRef, useState } from 'react';
import { Controller, useFieldArray, useForm } from 'react-hook-form';

function Upload({ images }: { images: any }) {
  const [name, setName] = useState('');
  const { control, handleSubmit } = useForm({ values: { images } });
  const { fields, replace } = useFieldArray({ control, name: 'images' });

  async function uploadImageToS3(data) {
    parent.postMessage(
      {
        pluginMessage: {
          key: 'upload',
          data,
        },
      },
      '*',
    );
  }
  async function imageFocus(id) {
    parent.postMessage(
      {
        pluginMessage: {
          key: 'image-focus',
          data: id,
        },
      },
      '*',
    );
  }

  return (
    <form onSubmit={handleSubmit(uploadImageToS3)}>
      <div className="upload-header">
        <div className="input">
          <input
            style={{ marginTop: '8px' }}
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              replace(
                fields.map((v, i) => ({
                  ...v,
                  name: `${e.target.value}-${i + 1}`,
                })),
              );
            }}
          />
          <select
            defaultValue="1"
            onChange={(e) => {
              replace(
                fields.map((v) => ({
                  ...v,
                  value: e.target.value,
                })),
              );
            }}
          >
            <option value="0.5">0.5x</option>
            <option value="0.75">0.75x</option>
            <option value="1">1x</option>
            <option value="1.5">1.5x</option>
            <option value="2">2x</option>
            <option value="3">3x</option>
            <option value="4">4x</option>
          </select>
          <select
            defaultValue="PNG"
            onChange={(e) => {
              replace(
                fields.map((v) => ({
                  ...v,
                  format: e.target.value,
                })),
              );
            }}
          >
            <option value="PNG">PNG</option>
            <option value="JPG">JPG</option>
          </select>
        </div>
      </div>
      <label>선택된 이미지 목록</label>
      {fields?.map((item, index) => {
        return (
          <Controller
            control={control}
            key={item.id}
            name={`images.${index}`}
            render={({ field }) => {
              return (
                <div className="input" key={`${item.id}-${index}`}>
                  <button
                    type="button"
                    style={{
                      width: 30,
                      height: 30,
                      margin: 0,
                      background: 'transparent',
                      borderWidth: '1px',
                      padding: 0,
                      flexShrink: 0,
                      cursor: 'pointer',
                    }}
                    onClick={() => imageFocus(field.value.nodeId)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#111"
                      strokeWidth="1"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-navigation"
                    >
                      <polygon points="3 11 22 2 13 21 11 13 3 11" />
                    </svg>
                  </button>
                  <input
                    placeholder={field.value.name}
                    onChange={(e) =>
                      field.onChange({
                        ...field.value,
                        name: e.target.value,
                      })
                    }
                    value={field.value.name}
                  />
                  <select
                    value={field.value.value}
                    defaultValue="1"
                    onChange={(e) => {
                      field.onChange({ ...field.value, value: e.target.value });
                    }}
                  >
                    <option value="0.5">0.5x</option>
                    <option value="0.75">0.75x</option>
                    <option value="1">1x</option>
                    <option value="1.5">1.5x</option>
                    <option value="2">2x</option>
                    <option value="3">3x</option>
                    <option value="4">4x</option>
                  </select>
                  <select
                    value={field.value.format}
                    defaultValue="PNG"
                    onChange={(e) => {
                      field.onChange({
                        ...field.value,
                        format: e.target.value,
                      });
                    }}
                  >
                    <option value="PNG">PNG</option>
                    <option value="JPG">JPG</option>
                  </select>
                </div>
              );
            }}
          />
        );
      })}

      <button type="submit">Upload</button>
    </form>
  );
}

export default Upload;
