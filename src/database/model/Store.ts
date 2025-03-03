// import mongoose, { Schema, Document } from 'mongoose';

// export interface IStore extends Document {
//     fileUrl: string;
//     fileName: string;
//     fileType: string;
//     uploadDate: Date;
// }

// const StoreSchema: Schema = new Schema({
//     fileUrl: { type: String, required: true },
//     fileName: { type: String, required: true },
//     fileType: { type: String, required: true },
//     uploadDate: { type: Date, default: Date.now }
// });

// export const Store = mongoose.model<IStore>('Store', StoreSchema);


import { Schema, model } from 'mongoose';

export interface Store {
  fileUrl: string;
  fileName: string;
  fileType: string;
  uploadDate: Date;
}

const storeSchema = new Schema<Store>({
  fileUrl: { type: String, required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true },
  uploadDate: { type: Date, default: Date.now }
});

export const StoreModel = model<Store>('Store', storeSchema);