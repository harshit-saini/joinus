// app/invite/[id]/page.tsx
import dbConnect from '../../lib/mongoose';
import InviteModel from '../../lib/models/invite';

interface Props {
  params: { id: string };
}

export default async function InvitePage({ params }: Props) {
  await dbConnect();
  const doc = await InviteModel.findById(params.id).lean();

  if (!doc) {
    return <div>Invite not found</div>;
  }

  return (
    <div>
      <h2>{doc.title || `${doc.eventType} Invitation`}</h2>
      <p>{doc.message}</p>
      {doc.date && <p>Date: {doc.date}</p>}
      {doc.eventType === 'Wedding' && (
        <p>
          <strong>{doc.bride}</strong> &amp; <strong>{doc.groom}</strong>
        </p>
      )}
    </div>
  );
}