import React, { useState } from 'react';
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

  return (
    <form onSubmit={handleSubmit(uploadImageToS3)}>
      <label>Name</label>
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
      {fields?.map((item, index) => {
        return (
          <Controller
            control={control}
            key={item.id}
            name={`images.${index}`}
            render={({ field }) => {
              return (
                <div className="input" key={`${item.id}-${index}`}>
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
