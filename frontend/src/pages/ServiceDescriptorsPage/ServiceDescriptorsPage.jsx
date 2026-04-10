import { useCallback, useState } from 'react';

import DrawerPage from '@/components/DrawerPage';
import DrawerPageHeader from '@/components/DrawerPageHeader';
import { useServiceDescriptorListQuery, useServiceDescriptorDeleteMutation } from '@/api/serviceDescriptorsApi';
import ServiceDescriptorsTable from './ServiceDescriptorsTable';

function ServiceDescriptorsPage() {
  const [search, setSearch] = useState('');
  
  const { data: descriptors = [], isFetching, isError } = useServiceDescriptorListQuery();
  const [deleteDescriptor] = useServiceDescriptorDeleteMutation();

  const handleSearchChange = useCallback((value) => {
    setSearch(value);
  }, []);

  const handleDelete = useCallback(async (descriptor) => {
    if (window.confirm(`Are you sure you want to delete this descriptor?`)) {
      try {
        await deleteDescriptor({
          project_id: descriptor.project_id,
          provider_name: descriptor.provider_name,
          service_location_url: descriptor.service_location_url,
        }).unwrap();
      } catch (err) {
        console.error('Failed to delete descriptor', err);
      }
    }
  }, [deleteDescriptor]);

  return (
    <DrawerPage sx={{ overflow: 'hidden' }}>
      <DrawerPageHeader
        title="Service Descriptors"
        showBorder
        showSearchInput
        search={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Search providers or URLs"
      />
      <ServiceDescriptorsTable 
        descriptors={descriptors} 
        search={search} 
        onDelete={handleDelete}
        isFetching={isFetching}
      />
    </DrawerPage>
  );
}

export default ServiceDescriptorsPage;
