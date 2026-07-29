import React from 'react';
import { ReverseTransferView } from './ReverseTransferView';
import { CargoLoad, User } from '../types';

interface ColetasViewProps {
  onSubmit: (newLoad: Omit<CargoLoad, 'id' | 'status' | 'createdAt' | 'createdBy'>) => Promise<void>;
  onUpdateLoad?: (updatedLoad: CargoLoad) => Promise<void>;
  onDeleteLoad?: (loadId: string) => Promise<void>;
  loads: CargoLoad[];
  currentUser?: User;
}

export const ColetasView: React.FC<ColetasViewProps> = (props) => {
  return <ReverseTransferView {...props} operationMode="COLETA_TERCEIRO" />;
};
