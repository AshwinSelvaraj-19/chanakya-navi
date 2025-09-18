# Chanakya University - Campus Navigation

An interactive georeferenced campus map and chatbot-style route finder for Chanakya University. Features a blueprint overlay on satellite base with intelligent pathfinding and distance calculations.

## Features

- **Interactive Map**: Leaflet-powered map with OpenStreetMap tiles
- **Blueprint Overlay**: Campus blueprint overlaid on satellite imagery
- **Smart Search**: Typeahead search for quick location finding
- **Route Planning**: Dijkstra's algorithm for shortest path calculation
- **Real-time Navigation**: Step-by-step route instructions with distances
- **Calibration Tools**: Fine-tune overlay positioning with lat/lng bounds
- **Mobile Responsive**: Google Maps-inspired UI that works on all devices
- **Graph Management**: Import/export functionality for route data

## Quick Start

1. **Clone and Install**
   ```bash
   npm install
   npm run dev
   ```

2. **Access the Application**
   Open your browser to `http://localhost:8080`

## File Structure

```
├── public/
│   ├── assets/
│   │   ├── blueprint.jpg     # Campus blueprint overlay
│   │   ├── satellite.jpg     # Satellite base image
│   │   └── distances-reference.jpg # Reference distances
│   └── data/
│       └── distances.json    # Graph data (nodes + edges)
├── src/
│   ├── components/
│   │   └── CampusMap.tsx    # Main map component
│   ├── pages/
│   │   └── Index.tsx        # Main page
│   └── index.css            # Design system
```

## Configuration

### Swapping Images

To use your own campus images:

1. Replace `public/assets/blueprint.jpg` with your blueprint image
2. Replace `public/assets/satellite.jpg` with your satellite image
3. Update overlay bounds in the calibration panel to match your coordinates

### Calibrating the Overlay

1. Click the "Calibration" button in the sidebar
2. Adjust the North, South, East, West coordinates
3. Click "Update Overlay" to apply changes
4. Fine-tune until the blueprint aligns perfectly with the satellite base

### Editing Distances

Edit `public/data/distances.json` to modify:

- **Nodes**: Add/remove locations with `{id, name, lat, lng}`
- **Edges**: Add/remove paths with `{a, b, dist}` (distance in meters)
- **Metadata**: Update center coordinates and overlay bounds

Example node:
```json
{"id":"library","name":"Library","lat":12.9485,"lng":77.6685}
```

Example edge:
```json
{"a":"library","b":"admin1","dist":150}
```

## Campus Locations

Current locations in the system:

- **Gate 1** & **Gate 2**: Main entrances
- **Admin Block 1** & **Admin Block 2**: Administrative buildings
- **Junction**: Central pathway intersection
- **Parents Stay Area**: Visitor accommodation
- **Food Court**: Dining facilities
- **Hostel 1**: Student accommodation
- **Eng Block**: Engineering department
- **Sports Area**: Athletic facilities
- **Faculty Quarters**: Staff housing

## Usage Guide

### Finding Locations
1. Use the search bar to quickly jump to any location
2. Type partial names for autocomplete suggestions
3. Click on suggestions to navigate to the location

### Planning Routes
1. Select your starting location from the dropdown
2. Choose your destination
3. Click "Find Route" to calculate the shortest path
4. View step-by-step directions with distances

### Navigation Features
- **Route Visualization**: Green polyline shows the optimal path
- **Distance Calculation**: Total meters displayed with breakdown
- **Interactive Markers**: Click markers for location details
- **Responsive Design**: Works seamlessly on mobile and desktop

## Technical Details

### Technologies Used
- **React 18** with TypeScript
- **Leaflet** for interactive mapping
- **Tailwind CSS** for styling
- **Dijkstra's Algorithm** for pathfinding
- **OpenStreetMap** for base tiles

### Algorithm Details
The route finder uses Dijkstra's shortest path algorithm with:
- **Weighted Edges**: Real measured distances in meters
- **Bidirectional Graph**: Paths work in both directions
- **Optimal Routes**: Always finds the shortest total distance

### Coordinate System
- **Base Map**: WGS84 (EPSG:4326) coordinates
- **Overlay**: Georeferenced to Bangalore region (approx 12.95°N, 77.67°E)
- **Distance Units**: Meters for all calculations

## Customization

### Design System
The app uses a comprehensive design system defined in `src/index.css`:
- **Primary Blue**: Navigation and interactive elements
- **Navigation Green**: Route visualization
- **Professional Gradients**: Buttons and panels
- **Semantic Colors**: Consistent theming

### Adding New Locations
1. Determine lat/lng coordinates for the new location
2. Add node to `distances.json`
3. Add edges connecting to existing locations with measured distances
4. The location will automatically appear in search and dropdowns

### Performance Optimization
- **Efficient Rendering**: Only updates map when necessary
- **Smart Search**: Debounced typeahead prevents excessive filtering
- **Optimized Routes**: Caches route calculations
- **Responsive Images**: Properly sized overlays

## Deployment

### Static Hosting
The app is a static React application that can be deployed to any static hosting service:

1. **Build for Production**
   ```bash
   npm run build
   ```

2. **Deploy the `dist` folder** to your hosting provider:
   - Netlify
   - Vercel
   - GitHub Pages
   - AWS S3 + CloudFront

### Environment Setup
No environment variables or backend services required. All data is stored in static JSON files.

## Troubleshooting

### Common Issues

**Blueprint not aligned with satellite**
- Use the calibration panel to adjust overlay bounds
- Start with approximate coordinates and fine-tune visually

**Route not found**
- Ensure both locations exist in the graph
- Check that there's a connected path of edges between locations

**Search not working**
- Verify location names match those in `distances.json`
- Check that the JSON file is properly formatted

**Map not loading**
- Check browser console for JavaScript errors
- Ensure Leaflet CSS is properly imported
- Verify image assets are accessible

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge (latest versions)
- **Mobile**: iOS Safari, Chrome Mobile, Samsung Internet
- **Requirements**: ES6+ support, WebGL for map rendering

### Performance Tips
- Keep image file sizes reasonable (< 2MB per image)
- Limit nodes to < 50 for optimal performance
- Use efficient image formats (JPEG for photos, PNG for graphics)

## Contributing

To add new features or improve the application:

1. Fork the repository
2. Create a feature branch
3. Implement changes following the existing design patterns
4. Test on multiple devices and browsers
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For technical support or feature requests, please create an issue in the project repository.

---

**Chanakya University Campus Navigation** - Making campus navigation simple and efficient.