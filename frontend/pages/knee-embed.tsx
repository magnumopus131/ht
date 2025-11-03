export default function KneeEmbed() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">3D Knee (Sketchfab)</h1>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div style={{ position: 'relative', paddingTop: '56.25%' }}>
            <iframe
              title="Ruptured ACL"
              src="https://sketchfab.com/models/065e869479284d1e86800c2f0d928950/embed"
              allow="autoplay; fullscreen; xr-spatial-tracking"
              allowFullScreen
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 0 }}
            />
          </div>
          <div className="p-3 text-xs text-gray-600">
            Model: <a className="text-primary-600" href="https://sketchfab.com/3d-models/ruptured-acl-065e869479284d1e86800c2f0d928950" target="_blank" rel="noreferrer">Ruptured ACL</a> by <a className="text-primary-600" href="https://sketchfab.com/anatomy_dundee" target="_blank" rel="noreferrer">University of Dundee, CAHID</a> on Sketchfab.
          </div>
        </div>
      </div>
    </div>
  )
}


