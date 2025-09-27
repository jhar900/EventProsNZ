/**
 * Contractors Map Page
 * Interactive map page for viewing contractors
 */

'use client';

import React from 'react';
import { MapboxProvider } from '@/lib/maps/mapbox-context';
import { InteractiveMap } from '@/components/features/map/InteractiveMap';
import { MapSearch } from '@/components/features/map/MapSearch';
import { MapFilters } from '@/components/features/map/MapFilters';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

export default function ContractorsMapPage() {
  return (
    <MapboxProvider>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-4">
              {/* Breadcrumbs */}
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/">Home</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/contractors">
                      Contractors
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Map</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>

              {/* Page Title */}
              <div className="mt-4">
                <h1 className="text-2xl font-bold text-gray-900">
                  Contractor Map
                </h1>
                <p className="mt-1 text-sm text-gray-600">
                  Explore contractors across New Zealand on an interactive map
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1 space-y-4">
              {/* Search */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Search
                </h2>
                <MapSearch />
              </div>

              {/* Filters */}
              <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">
                  Filters
                </h2>
                <MapFilters />
              </div>
            </div>

            {/* Map */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                <div className="h-96 lg:h-[600px]">
                  <InteractiveMap
                    className="w-full h-full"
                    showControls={true}
                    showLayers={true}
                    showLegend={true}
                    onContractorSelect={contractorId => {
                      }}
                    onMapReady={map => {
                      }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MapboxProvider>
  );
}
