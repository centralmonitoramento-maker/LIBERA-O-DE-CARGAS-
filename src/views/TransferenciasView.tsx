import React from 'react';
import { ReverseTransferView } from './ReverseTransferView';
import { CargoLoad, User } from '../types';

interface TransferenciasViewProps {
  onSubmit: (newLoad: Omit<CargoLoad, 'id' | 'status' | 'createdAt' | 'createdBy'>) => Promise<void>;
  onUpdateLoad?: (updatedLoad: CargoLoad) => Promise<void>;
  onDeleteLoad?: (loadId: string) => Promise<void>;
  loads: CargoLoad[];
  currentUser?: User;
}

export const TransferenciasView: React.FC<TransferenciasViewProps> = (props) => {
  return <ReverseTransferView {...props} operationMode="TRANSFERENCIA" />;
};
